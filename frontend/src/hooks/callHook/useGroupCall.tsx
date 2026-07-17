import { useEffect, useRef, useState, useCallback } from "react";
import { isUnloading } from "@/utils/unload";

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
    const [busyUsers, setBusyUsers] = useState<string[]>([]);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStream = useRef<MediaStream | null>(null);
    const isCaller = useRef(false);
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
        if (socket && currentUser && activeConversationId.current && !isUnloading) {
            socket.emit("leave-group-call", {
                conversationId: activeConversationId.current,
                userId: currentUser._id,
            });

            // Notify other members to cancel their incoming call dialogs if they haven't answered
            const targetIds = groupMembers.map(m => m._id).filter(id => id !== currentUser._id);
            if (targetIds.length > 0) {
                socket.emit("cancel-group-call", { targetUserIds: targetIds, conversationId: activeConversationId.current });
            }
        }
        if (!isUnloading) {
            sessionStorage.removeItem("activeCall");
        }
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
    }, [cleanupAllPeers, socket, currentUser]);

    const getLocalStream = async (type: "audio" | "video") => {
        // Return existing stream only if tracks are still live
        if (localStream.current && localStream.current.getTracks().some(t => t.readyState === "live")) {
            return localStream.current;
        }
        localStream.current = null;
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
                socket.emit("group-ice-candidate", {
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
        if (!currentUser || !conversationId || calling) return;
        activeConversationId.current = conversationId;
        setCallType(type);
        setCalling(true);
        setCallAccepted(true);

        sessionStorage.setItem("activeCall", JSON.stringify({
            type: "group",
            conversationId,
            callType: type
        }));

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

            socket.emit("start-group-call", {
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

        sessionStorage.setItem("activeCall", JSON.stringify({
            type: "group",
            conversationId: incoming.conversationId,
            callType: incoming.callType
        }));

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

            socket.emit("join-group-call", {
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
        cleanupCall();
    };

    const inviteGroupUser = (targetUserId: string) => {
        if (!activeConversationId.current || !currentUser) return;
        socket.emit("invite-to-group-call", {
            conversationId: activeConversationId.current,
            caller: currentUser,
            callType: callType || "audio",
            targetUserId,
        });
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

                socket.emit("toggle-group-mic", {
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
                        socket.emit("group-webrtc-offer", {
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

                    socket.emit("toggle-group-camera", {
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

            socket.emit("toggle-group-camera", {
                conversationId: activeConversationId.current,
                userId: currentUser._id,
                isVideoOff: !track.enabled,
            });
        }
    };

    const recoveryAttempted = useRef(false);

    useEffect(() => {
        if (!socket || !currentUser) return;

        const checkRecovery = async () => {
            if (recoveryAttempted.current) return;
            recoveryAttempted.current = true;

            const saved = sessionStorage.getItem("activeCall");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.type === "group") {
                        isCaller.current = false;
                        activeConversationId.current = parsed.conversationId;
                        setCallType(parsed.callType);
                        setCalling(true);
                        setCallAccepted(true);
                        
                        setParticipants([{
                            _id: currentUser._id,
                            name: "You",
                            avatar: currentUser.avatar,
                            isVideoOff: parsed.callType === "audio",
                            isMuted: false,
                        }]);

                        await getLocalStream(parsed.callType);
                        socket.emit("join-group-call", {
                            conversationId: parsed.conversationId,
                            user: currentUser,
                        });
                    }
                } catch (e) {
                    console.error("Recovery failed", e);
                }
            }
        };
        checkRecovery();

        const handleIncomingCall = (data: any) => {
            if (calling || localStream.current) return;
            setIncomingCall(data);
        };

        const handleUserJoined = async ({ user }: any) => {
            if (!calling) return;
            if (!peerConnections.current || !activeConversationId.current) return;



            setParticipants(prev => {
                if (prev.some(p => p._id === user._id)) return prev;
                return [...prev, {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                    isVideoOff: callType === "audio",
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

                socket.emit("group-webrtc-offer", {
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
            if (!calling) return;

            // Wait for local stream to be fully initialized before answering
            if (!localStream.current && callType) {
                await getLocalStream(callType);
            }

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
                        isVideoOff: callType === "audio",
                        isMuted: false,
                    }];
                });
            }

            try {
                if (pc.signalingState === "have-remote-offer") {
                    console.warn(`[webrtc-offer] Skipping: Already have remote offer (signalingState: ${pc.signalingState})`);
                    return;
                }
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
                socket.emit("group-webrtc-answer", {
                    targetUserId: senderId,
                    senderId: currentUser._id,
                    answer,
                });
            } catch (err) {
                console.error("Failed to handle offer:", err);
            }
        };

        const handleAnswer = async ({ senderId, answer }: any) => {
            if (!calling) return;
            const pc = peerConnections.current.get(senderId);
            if (!pc) return;
            if (pc.signalingState !== "have-local-offer") {
                console.warn(`[webrtc-answer] Skipping: Signaling state is not have-local-offer (current: ${pc.signalingState})`);
                return;
            }
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
            if (!calling) return;
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
            if (!calling) return;
            setParticipants(prev => prev.filter(p => p._id !== userId));
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
            cleanupPeer(userId);
        };

        const handleRemoteMic = ({ userId, isMuted }: any) => {
            if (!calling) return;
            setParticipants(prev => prev.map(p =>
                p._id === userId ? { ...p, isMuted } : p
            ));
        };

        const handleRemoteCamera = ({ userId, isVideoOff }: any) => {
            if (!calling) return;
            setParticipants(prev => prev.map(p =>
                p._id === userId ? { ...p, isVideoOff } : p
            ));
        };

        const handleReconnect = () => {
            if (calling && activeConversationId.current) {
                console.log("[socket] Reconnected. Rejoining group call room...");
                socket.emit("join-group-call", {
                    conversationId: activeConversationId.current,
                    user: currentUser,
                });
            }
        };

        const handleBusyUsersUpdate = (busyList: string[]) => {
            setBusyUsers(busyList);
        };

        const handleUserBusy = ({ targetUserIds }: any) => {
            let names = "";
            if (targetUserIds && Array.isArray(targetUserIds)) {
                names = groupMembers
                    .filter(m => targetUserIds.includes(m._id))
                    .map(m => m.name)
                    .join(", ");
            }
            // Show red toast at top center
            const toast = document.createElement("div");
            toast.innerText = names ? `${names} is currently busy` : "Some members are currently busy";
            toast.style.cssText = [
                "position:fixed",
                "top:24px",
                "left:50%",
                "transform:translateX(-50%)",
                "background:#dc2626",
                "color:#fff",
                "padding:12px 28px",
                "border-radius:12px",
                "font-weight:600",
                "font-size:14px",
                "z-index:99999",
                "box-shadow:0 4px 20px rgba(0,0,0,0.5)",
                "letter-spacing:0.01em",
                "pointer-events:none",
                "animation:fadeInDown 0.25s ease",
            ].join(";");
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        };

        const handleCancelGroupCall = ({ conversationId }: any) => {
            setIncomingCall((prev: any) => {
                if (prev && prev.conversationId === conversationId) return null;
                return prev;
            });
        };

        socket.emit("get-busy-users");

        socket.on("connect", handleReconnect);
        socket.on("busy-users-update", handleBusyUsersUpdate);
        socket.on("user-busy", handleUserBusy);
        socket.on("group-incoming-call", handleIncomingCall);
        socket.on("group-call-cancelled", handleCancelGroupCall);
        socket.on("group-user-joined", handleUserJoined);
        socket.on("group-webrtc-offer", handleOffer);
        socket.on("group-webrtc-answer", handleAnswer);
        socket.on("group-ice-candidate", handleIceCandidate);
        socket.on("group-user-left", handleUserLeft);
        socket.on("group-user-toggle-mic", handleRemoteMic);
        socket.on("group-user-toggle-camera", handleRemoteCamera);

        return () => {
            socket.off("connect", handleReconnect);
            socket.off("busy-users-update", handleBusyUsersUpdate);
            socket.off("user-busy", handleUserBusy);
            socket.off("group-incoming-call", handleIncomingCall);
            socket.off("group-user-joined", handleUserJoined);
            socket.off("group-webrtc-offer", handleOffer);
            socket.off("group-webrtc-answer", handleAnswer);
            socket.off("group-ice-candidate", handleIceCandidate);
            socket.off("group-user-left", handleUserLeft);
            socket.off("group-user-toggle-mic", handleRemoteMic);
            socket.off("group-user-toggle-camera", handleRemoteCamera);
            socket.off("group-call-cancelled", handleCancelGroupCall);
        };
    }, [socket, currentUser, calling, cleanupPeer, cleanupCall]);

    const cleanupCallRef = useRef(cleanupCall);
    useEffect(() => {
        cleanupCallRef.current = cleanupCall;
    }, [cleanupCall]);

    // Ensure all peers are cleaned up on full unmount
    useEffect(() => {
        return () => {
            if (cleanupCallRef.current) cleanupCallRef.current();
            cleanupAllPeers();
        };
    }, [cleanupAllPeers]);

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
        busyUsers,
        startGroupCall,
        acceptGroupCall,
        rejectGroupCall,
        endGroupCall,
        inviteGroupUser,
        toggleLocalMic,
        toggleLocalCamera,
    };
};
