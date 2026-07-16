import { useEffect, useRef, useState, useCallback } from "react";

interface Participant {
    _id: string;
    name: string;
    avatar?: string;
    isVideoOff: boolean;
    isMuted: boolean;
}

interface UseGroupCallProps {
    socket: any;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    groupMembers: {
        _id: string;
        name: string;
        avatar?: string;
    }[];
    conversationId: string | null;
}

export const useGroupCall = ({
    socket,
    currentUser,
    groupMembers,
    conversationId,
}: UseGroupCallProps) => {
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
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
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
                console.warn("Failed to get local video stream, trying audio fallback...", err);
            }
        }

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
            console.error("Failed to get local audio stream.", err);
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

    const startGroupCall = async (type: "audio" | "video") => {
        if (!currentUser || !conversationId) return;
        activeConversationId.current = conversationId;
        setCallType(type);
        setCalling(true);
        setCallAccepted(true);

        setParticipants([
            {
                _id: currentUser._id,
                name: "You",
                avatar: currentUser.avatar,
                isVideoOff: type === "audio",
                isMuted: false,
            }
        ]);

        try {
            await getLocalStream(type);

            const targetUserIds = groupMembers
                .filter(m => m._id !== currentUser._id)
                .map(m => m._id);

            socket.emit("start-call", {
                conversationId,
                caller: currentUser,
                callType: type,
                targetUserIds,
            });
        } catch (err) {
            cleanupCall();
        }
    };

    const acceptGroupCall = async () => {
        if (!incomingCall || !currentUser) return;
        const incoming = incomingCall;
        activeConversationId.current = incoming.conversationId;
        setCallType(incoming.callType);
        setCalling(true);
        setCallAccepted(true);

        setParticipants([
            {
                _id: currentUser._id,
                name: "You",
                avatar: currentUser.avatar,
                isVideoOff: incoming.callType === "audio",
                isMuted: false,
            }
        ]);

        setIncomingCall(null);

        try {
            await getLocalStream(incoming.callType);

            socket.emit("join-call", {
                conversationId: incoming.conversationId,
                user: currentUser,
            });
        } catch (err) {
            cleanupCall();
        }
    };

    const rejectGroupCall = () => {
        setIncomingCall(null);
    };

    const endGroupCall = () => {
        if (!currentUser || !activeConversationId.current) return;
        socket.emit("leave-call", {
            conversationId: activeConversationId.current,
            userId: currentUser._id,
        });
        cleanupCall();
    };

    const toggleLocalMic = () => {
        if (localStream.current && currentUser && activeConversationId.current) {
            const track = localStream.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setMicEnabled(track.enabled);

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

    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleIncomingCall = (data: any) => {
            if (calling || localStream.current) return;
            setIncomingCall(data);
        };

        const handleUserJoined = async ({ user }: any) => {
            if (!peerConnections.current || !activeConversationId.current) return;

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

            const pc = createPeerConnection(user._id);

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
                console.error("Failed to create offer:", err);
            }
        };

        const handleOffer = async ({ senderId, sender, offer }: any) => {
            let pc = peerConnections.current.get(senderId);
            if (!pc) {
                pc = createPeerConnection(senderId);
            }

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

                // Process pending candidates
                const queued = pendingCandidates.current.get(senderId) || [];
                while (queued.length > 0) {
                    const cand = queued.shift();
                    if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                }

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
                console.error("Failed to handle offer:", err);
            }
        };

        const handleAnswer = async ({ senderId, answer }: any) => {
            const pc = peerConnections.current.get(senderId);
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));

                // Process pending candidates
                const queued = pendingCandidates.current.get(senderId) || [];
                while (queued.length > 0) {
                    const cand = queued.shift();
                    if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                }
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
                if (!pendingCandidates.current.has(senderId)) {
                    pendingCandidates.current.set(senderId, []);
                }
                pendingCandidates.current.get(senderId)!.push(candidate);
            }
        };

        const handleUserLeft = ({ userId }: any) => {
            setParticipants(prev => prev.filter(p => p._id !== userId));
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
            cleanupPeer(userId);
        };

        const handleRemoteMic = ({ userId, isMuted }: any) => {
            setParticipants(prev => prev.map(p =>
                p._id === userId ? { ...p, isMuted } : p
            ));
        };

        const handleRemoteCamera = ({ userId, isVideoOff }: any) => {
            setParticipants(prev => prev.map(p =>
                p._id === userId ? { ...p, isVideoOff } : p
            ));
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("user-joined", handleUserJoined);
        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("user-left", handleUserLeft);
        socket.on("toggle-mic", handleRemoteMic);
        socket.on("toggle-camera", handleRemoteCamera);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("user-joined", handleUserJoined);
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("user-left", handleUserLeft);
            socket.off("toggle-mic", handleRemoteMic);
            socket.off("toggle-camera", handleRemoteCamera);
        };
    }, [socket, currentUser, calling, cleanupPeer]);

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
        startGroupCall,
        acceptGroupCall,
        rejectGroupCall,
        endGroupCall,
        toggleLocalMic,
        toggleLocalCamera,
    };
};
