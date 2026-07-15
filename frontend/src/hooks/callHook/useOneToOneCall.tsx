import { useEffect, useRef, useState, useCallback } from "react";

interface Participant {
    _id: string;
    name: string;
    avatar?: string;
    isVideoOff: boolean;
    isMuted: boolean;
}

interface UseOneToOneCallProps {
    socket: any;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    otherUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    conversationId: string | null;
}

export const useOneToOneCall = ({
    socket,
    currentUser,
    otherUser,
    conversationId,
}: UseOneToOneCallProps) => {
    const [calling, setCalling] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callType, setCallType] = useState<"audio" | "video" | null>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    
    const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [participants, setParticipants] = useState<Participant[]>([]);
    
    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStream = useRef<MediaStream | null>(null);
    const isCaller = useRef(false);
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    
    // Store conversation ID internally so control methods work even if selectedchat is null on recipient side
    const activeConversationId = useRef<string | null>(null);

    const cleanupPeer = useCallback((userId: string) => {
        const pc = peerConnections.current.get(userId);
        if (pc) {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.onconnectionstatechange = null;
            pc.close();
            peerConnections.current.delete(userId);
        }
        pendingCandidates.current.delete(userId);
    }, []);

    const cleanupAllPeers = useCallback(() => {
        peerConnections.current.forEach((_, userId) => {
            cleanupPeer(userId);
        });
        peerConnections.current.clear();
        pendingCandidates.current.clear();
    }, [cleanupPeer]);

    const cleanupCall = useCallback(() => {
        cleanupAllPeers();
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
            localStream.current = null;
        }
        setLocalMediaStream(null);
        setRemoteStreams(new Map());
        setParticipants([]);
        setCalling(false);
        setCallAccepted(false);
        setCallType(null);
        setIncomingCall(null);
        setMicEnabled(true);
        setCameraEnabled(true);
        isCaller.current = false;
        activeConversationId.current = null;
    }, [cleanupAllPeers]);

    const getLocalStream = async (type: "audio" | "video") => {
        const audioConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
        const videoConstraints = {
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 15 }
        };

        if (type === "video") {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraints,
                    video: videoConstraints,
                });
                localStream.current = stream;
                setLocalMediaStream(stream);
                setMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
                setCameraEnabled(stream.getVideoTracks()[0]?.enabled ?? true);
                return stream;
            } catch (err) {
                console.warn("Failed to get local video stream, trying audio-only fallback...", err);
            }
        }

        // Try audio-only or fallback audio
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: false,
            });
            localStream.current = stream;
            setLocalMediaStream(stream);
            setMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
            setCameraEnabled(false);
            return stream;
        } catch (err) {
            console.error("Failed to get local audio stream. Continuing call without local media tracks.", err);
            localStream.current = null;
            setLocalMediaStream(null);
            setMicEnabled(false);
            setCameraEnabled(false);
            return null;
        }
    };

    const createPeerConnection = (targetUserId: string) => {
        cleanupPeer(targetUserId);
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && currentUser) {
                socket.emit("ice-candidate", {
                    targetUserId,
                    senderId: currentUser._id,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (stream) {
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetUserId, new MediaStream(stream.getTracks()));
                    return newMap;
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                // Remove participant from list and cleanup their stream
                setParticipants(prev => prev.filter(p => p._id !== targetUserId));
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetUserId);
                    return newMap;
                });
                cleanupPeer(targetUserId);
            }
        };

        peerConnections.current.set(targetUserId, pc);
        return pc;
    };

    const startCall = async (type: "audio" | "video") => {
        if (!otherUser || !currentUser || !conversationId) return;
        isCaller.current = true;
        activeConversationId.current = conversationId;
        setCallType(type);
        setCalling(true);

        // Add local user to participants list
        setParticipants([
            {
                _id: currentUser._id,
                name: "You",
                avatar: currentUser.avatar,
                isVideoOff: type === "audio",
                isMuted: false,
            },
            {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar,
                isVideoOff: true,
                isMuted: false,
            }
        ]);

        try {
            await getLocalStream(type);
            createPeerConnection(otherUser._id);
            
            socket.emit("start-call", {
                conversationId,
                caller: currentUser,
                callType: type,
                targetUserIds: [otherUser._id],
            });
        } catch (err) {
            cleanupCall();
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !currentUser) return;
        const caller = incomingCall.caller;
        isCaller.current = false;
        activeConversationId.current = incomingCall.conversationId;
        setCallType(incomingCall.callType);
        setCalling(true);
        setCallAccepted(true);

        setParticipants([
            {
                _id: currentUser._id,
                name: "You",
                avatar: currentUser.avatar,
                isVideoOff: incomingCall.callType === "audio",
                isMuted: false,
            },
            {
                _id: caller._id,
                name: caller.name,
                avatar: caller.avatar,
                isVideoOff: true,
                isMuted: false,
            }
        ]);

        setIncomingCall(null);

        try {
            await getLocalStream(incomingCall.callType);
            const pc = createPeerConnection(caller._id);

            // Add local tracks to connection
            if (localStream.current) {
                localStream.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStream.current!);
                });
            }

            // Emit join call to notify the room
            socket.emit("join-call", {
                conversationId: incomingCall.conversationId,
                user: currentUser,
            });

            // Process any queued candidates for caller
            const queued = pendingCandidates.current.get(caller._id) || [];
            while (queued.length > 0) {
                const cand = queued.shift();
                if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
        } catch (err) {
            cleanupCall();
        }
    };

    const rejectCall = () => {
        if (!incomingCall || !currentUser) return;
        socket.emit("leave-call", {
            conversationId: incomingCall.conversationId,
            userId: currentUser._id,
        });
        cleanupCall();
    };

    const endCall = () => {
        if (!currentUser || !activeConversationId.current) return;
        socket.emit("leave-call", {
            conversationId: activeConversationId.current,
            userId: currentUser._id,
        });
        cleanupCall();
    };

    const inviteUser = async (targetUserId: string, targetUser: any) => {
        // Enforce maximum 6 members in the calling room
        if (participants.length >= 6) {
            alert("Maximum 6 participants allowed in the call.");
            return;
        }

        if (!activeConversationId.current || !currentUser) return;

        // Emit invitation start-call to target user
        socket.emit("start-call", {
            conversationId: activeConversationId.current,
            caller: currentUser,
            callType: callType || "audio",
            targetUserIds: [targetUserId],
        });

        // Add the invited participant as placeholder in state
        setParticipants(prev => {
            if (prev.some(p => p._id === targetUserId)) return prev;
            return [...prev, {
                _id: targetUserId,
                name: targetUser.name,
                avatar: targetUser.avatar,
                isVideoOff: true,
                isMuted: false,
            }];
        });
    };

    const toggleLocalMic = () => {
        if (localStream.current && currentUser && activeConversationId.current) {
            const track = localStream.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setMicEnabled(track.enabled);
                
                // Update local participant state
                setParticipants(prev => prev.map(p => 
                    p._id === currentUser._id ? { ...p, isMuted: !track.enabled } : p
                ));

                socket.emit("toggle-mic", {
                    conversationId: activeConversationId.current,
                    userId: currentUser._id,
                    isMuted: !track.enabled,
                });
            }
        }
    };

    const toggleLocalCamera = async () => {
        if (!localStream.current || !currentUser || !activeConversationId.current) return;
        let track = localStream.current.getVideoTracks()[0];
        
        if (!track) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 360 },
                        frameRate: { ideal: 15 }
                    },
                });
                const newTrack = videoStream.getVideoTracks()[0];
                if (newTrack) {
                    localStream.current.addTrack(newTrack);
                    setLocalMediaStream(new MediaStream(localStream.current.getTracks()));
                    setCameraEnabled(true);
                    setCallType("video");

                    setParticipants(prev => prev.map(p => 
                        p._id === currentUser._id ? { ...p, isVideoOff: false } : p
                    ));

                    // Add new video track to all active peer connections
                    peerConnections.current.forEach(async (pc, peerId) => {
                        pc.addTrack(newTrack, localStream.current!);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit("webrtc-offer", {
                            targetUserId: peerId,
                            senderId: currentUser._id,
                            sender: {
                                _id: currentUser._id,
                                name: currentUser.name,
                                avatar: currentUser.avatar,
                            },
                            offer,
                        });
                    });

                    socket.emit("toggle-camera", {
                        conversationId: activeConversationId.current,
                        userId: currentUser._id,
                        isVideoOff: false,
                    });
                }
            } catch (err) {
                console.error("Failed to enable video track:", err);
            }
        } else {
            track.enabled = !track.enabled;
            setCameraEnabled(track.enabled);

            setParticipants(prev => prev.map(p => 
                p._id === currentUser._id ? { ...p, isVideoOff: !track.enabled } : p
            ));

            socket.emit("toggle-camera", {
                conversationId: activeConversationId.current,
                userId: currentUser._id,
                isVideoOff: !track.enabled,
            });
        }
    };

    // Socket Event Handlers
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleIncomingCall = (data: any) => {
            if (calling || localStream.current) return;
            setIncomingCall(data);
        };

        const handleUserJoined = async ({ user }: any) => {
            if (!peerConnections.current || !activeConversationId.current) return;

            setCallAccepted(true);

            // Add new user to participants state
            setParticipants(prev => {
                if (prev.some(p => p._id === user._id)) return prev;
                return [...prev, {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                    isVideoOff: true,
                    isMuted: false,
                }];
            });

            // Create peer connection for the newly joined user
            const pc = createPeerConnection(user._id);

            // Add local tracks to new connection
            if (localStream.current) {
                localStream.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStream.current!);
                });
            }

            try {
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(offer);
                
                socket.emit("webrtc-offer", {
                    targetUserId: user._id,
                    senderId: currentUser._id,
                    sender: {
                        _id: currentUser._id,
                        name: currentUser.name,
                        avatar: currentUser.avatar,
                    },
                    offer,
                });
            } catch (err) {
                console.error("Failed to create offer for new user:", err);
            }
        };

        const handleOffer = async ({ senderId, sender, offer }: any) => {
            let pc = peerConnections.current.get(senderId);
            if (!pc) {
                pc = createPeerConnection(senderId);
            }

            // Sync participant details
            if (sender) {
                setParticipants(prev => {
                    if (prev.some(p => p._id === senderId)) return prev;
                    return [...prev, {
                        _id: senderId,
                        name: sender.name,
                        avatar: sender.avatar,
                        isVideoOff: true,
                        isMuted: false,
                    }];
                });
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                
                // Add local tracks if not already added
                if (localStream.current) {
                    localStream.current.getTracks().forEach((track) => {
                        const senders = pc.getSenders();
                        const exists = senders.some(s => s.track?.id === track.id);
                        if (!exists) pc.addTrack(track, localStream.current!);
                    });
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("webrtc-answer", {
                    targetUserId: senderId,
                    senderId: currentUser._id,
                    answer,
                });
            } catch (err) {
                console.error("Failed to handle WebRTC offer:", err);
            }
        };

        const handleAnswer = async ({ senderId, answer }: any) => {
            const pc = peerConnections.current.get(senderId);
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error("Failed to set remote description from answer:", err);
            }
        };

        const handleIceCandidate = async ({ senderId, candidate }: any) => {
            const pc = peerConnections.current.get(senderId);
            if (pc && pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Failed to add ICE candidate:", err);
                }
            } else {
                let queued = pendingCandidates.current.get(senderId);
                if (!queued) {
                    queued = [];
                    pendingCandidates.current.set(senderId, queued);
                }
                queued.push(candidate);
            }
        };

        const handleUserLeft = ({ userId }: any) => {
            // Remove participant and their stream
            setParticipants(prev => prev.filter(p => p._id !== userId));
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
            cleanupPeer(userId);

            // If no remote users remain, end our call
            setParticipants(currentParticipants => {
                const hasOthers = currentParticipants.some(p => p._id !== currentUser._id);
                if (!hasOthers && calling) {
                    cleanupCall();
                }
                return currentParticipants;
            });
        };

        const handleUserToggleMic = ({ userId, isMuted }: any) => {
            setParticipants(prev => prev.map(p => 
                p._id === userId ? { ...p, isMuted } : p
            ));
        };

        const handleUserToggleCamera = ({ userId, isVideoOff }: any) => {
            setParticipants(prev => prev.map(p => 
                p._id === userId ? { ...p, isVideoOff } : p
            ));
            if (!isVideoOff) {
                setCallType("video");
            }
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("user-joined", handleUserJoined);
        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("user-left", handleUserLeft);
        socket.on("user-toggle-mic", handleUserToggleMic);
        socket.on("user-toggle-camera", handleUserToggleCamera);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("user-joined", handleUserJoined);
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("user-left", handleUserLeft);
            socket.off("user-toggle-mic", handleUserToggleMic);
            socket.off("user-toggle-camera", handleUserToggleCamera);
        };
    }, [socket, currentUser, calling, cleanupCall, cleanupPeer]);

    return {
        calling,
        callAccepted,
        callType,
        incomingCall,
        localStream: localMediaStream,
        remoteStreams,
        participants,
        micEnabled,
        cameraEnabled,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        inviteUser,
        toggleLocalMic,
        toggleLocalCamera,
    };
};
