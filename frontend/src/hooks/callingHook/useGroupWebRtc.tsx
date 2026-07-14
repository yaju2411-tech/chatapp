import { socket } from "@/socket/socket";
import { useEffect, useRef, useState } from "react";

interface CurrentUser {
    _id: string;
    name: string;
    avatar: string;
}
interface Participant {
    _id: string;
    name: string;
    avatar: string;
    email?: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
}

export const useGroupWebRtc = (user: CurrentUser, conversationId: string, members: Participant[] = []) => {
    //local camera
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    //all remote videos
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    //incomming calls
    const [incommingCall, setIncomingCall] = useState<any>(null);
    //current participants
    const [participants, setParticipants] = useState<Participant[]>([]);
    //peer connections
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const activeConversationIdRef = useRef<string | null>(null);

    const membersRef = useRef<Participant[]>(members);
    const userRef = useRef<CurrentUser>(user);

    useEffect(() => {
        membersRef.current = members;
    }, [members]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    //socket
    useEffect(() => {
        socket.on("group-call-started", data => {
            if (data.caller?._id === userRef.current._id) return;
            if (localStreamRef.current || activeConversationIdRef.current) return;
            setIncomingCall(data);
        });
        socket.on("group-user-joined", async ({ user: joinedUser }) => {
            setParticipants(prev => {
                if (prev.some(p => p._id === joinedUser._id)) {
                    return prev;
                }
                return [...prev, joinedUser];
            });
            // Ignore ourselves
            if (joinedUser._id === userRef.current._id) return;
            const pc = createPeerConnection(joinedUser._id);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("group-webrtc-offer", {
                senderId: userRef.current._id,
                sender: userRef.current,
                targetUserId: joinedUser._id,
                offer
            });
        });
        socket.on("group-webrtc-offer", async ({ senderId, sender, offer, }) => {
            setParticipants(prev => {
                if (prev.some(p => p._id === senderId)) return prev;
                if (sender) return [...prev, sender];
                const member = membersRef.current.find(m => m._id === senderId);
                return member ? [...prev, member] : [...prev, { _id: senderId, name: "User", avatar: "" }];
            });
            let pc = peerConnections.current.get(senderId);
            if (!pc) {
                pc = createPeerConnection(senderId);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("group-webrtc-answer", {
                senderId: userRef.current._id,
                sender: userRef.current,
                targetUserId: senderId,
                answer
            });
        });
        socket.on("group-webrtc-answer", async ({ senderId, sender, answer, }) => {
            setParticipants(prev => {
                if (prev.some(p => p._id === senderId)) return prev;
                if (sender) return [...prev, sender];
                const member = membersRef.current.find(m => m._id === senderId);
                return member ? [...prev, member] : [...prev, { _id: senderId, name: "User", avatar: "" }];
            });
            const pc = peerConnections.current.get(senderId);
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });
        socket.on("group-ice-candidate", async ({ senderId, candidate }) => {
            const pc = peerConnections.current.get(senderId);
            if (!pc) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("Failed to add ICE candidate", err);
            }
        });
        socket.on("group-user-left", ({ user }) => {
            if (!user) return;
            peerConnections.current.get(user._id)?.close();
            peerConnections.current.delete(user._id);
            setRemoteStreams(prev => {
                const map = new Map(prev);
                map.delete(user._id);
                return map;
            });
            setParticipants(prev =>
                prev.filter(p => p._id !== user._id)
            );
        });
        socket.on("group-call-ended", () => {
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
            localStreamRef.current?.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
            setRemoteStreams(new Map());
            setParticipants([]);
            setIncomingCall(null);
            activeConversationIdRef.current = null;
        });
        return () => {
            socket.off("group-call-started");
            socket.off("group-user-joined");
            socket.off("group-user-left");
            socket.off("group-call-ended");
            socket.off("group-webrtc-offer");
            socket.off("group-webrtc-answer");
            socket.off("group-ice-candidate");
        };
    }, []);

    const startGroupCall = async (callType: "audio" | "video") => {
        activeConversationIdRef.current = conversationId;
        const stream = await getLocalStream(callType);
        setLocalStream(stream);
        socket.emit("start-group-call", {
            conversationId, caller: userRef.current, callType
        });
        // Starter is automatically a participant
        setParticipants([userRef.current]);
    }
    const joinGroupCall = async (callType: "audio" | "video") => {
        const activeConversationId = conversationId || incommingCall?.conversationId;
        activeConversationIdRef.current = activeConversationId;
        const stream = await getLocalStream(callType);
        setLocalStream(stream);
        socket.emit("join-group-call", {
            conversationId: activeConversationId, user: userRef.current
        });
        // Local user is automatically a participant
        setParticipants(prev => {
            if (prev.some(p => p._id === userRef.current._id)) return prev;
            return [...prev, userRef.current];
        });
    }
    const leaveGroupCall = () => {
        peerConnections.current.forEach(pc => {
            pc.close();
        });
        peerConnections.current.clear();
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        const activeConversationId = conversationId || activeConversationIdRef.current;
        socket.emit("leave-group-call", { conversationId: activeConversationId, user: userRef.current });
        setLocalStream(null);
        setRemoteStreams(new Map());
        setParticipants([]);
        activeConversationIdRef.current = null;
    };
    const endGroupCall = () => {
        const activeConversationId = conversationId || activeConversationIdRef.current;
        leaveGroupCall();
        socket.emit("end-group-call", {
            conversationId: activeConversationId
        });
    }
    //create helper
    const createPeerConnection = (userId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }, {
                urls: [
                    "turn:global.relay.metered.ca:80",
                    "turn:global.relay.metered.ca:80?transport=tcp",
                    "turn:global.relay.metered.ca:443",
                    "turns:global.relay.metered.ca:443?transport=tcp",
                ],
                username: "...",
                credential: "...",
            }]
        });
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
        }
        peerConnections.current.set(userId, pc);
        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            socket.emit("group-ice-candidate", {
                targetUserId: userId,
                senderId: userRef.current._id,
                candidate: event.candidate,
            });
        }
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            setRemoteStreams(prev => {
                const map = new Map(prev);
                map.set(userId, stream);
                return map;
            });
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
                peerConnections.current.delete(userId);
                setRemoteStreams(prev => {
                    const map = new Map(prev);
                    map.delete(userId);
                    return map;
                });
            }
        };
        return pc;
    }
    //get local media
    const getLocalStream = async (callType: "audio" | "video") => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === "video",
            audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    }

    const rejectGroupCall = () => {
        setIncomingCall(null);
    };

    const toggleLocalMic = () => {
        if (!localStreamRef.current) return;
        const track = localStreamRef.current.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            const isMuted = !track.enabled;
            setParticipants(prev =>
                prev.map(p => p._id === userRef.current._id ? { ...p, isMuted } : p)
            );
            const activeConversationId = conversationId || activeConversationIdRef.current;
            socket.emit("group-toggle-mute", { conversationId: activeConversationId, userId: userRef.current._id, isMuted });
        }
    };

    const toggleLocalCamera = () => {
        if (!localStreamRef.current) return;
        const track = localStreamRef.current.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            const isVideoOff = !track.enabled;
            setParticipants(prev =>
                prev.map(p => p._id === userRef.current._id ? { ...p, isVideoOff } : p)
            );
            const activeConversationId = conversationId || activeConversationIdRef.current;
            socket.emit("group-toggle-video", { conversationId: activeConversationId, userId: userRef.current._id, isVideoOff });
        }
    };

    return {
        localStream, remoteStreams, participants, incommingCall,
        startGroupCall, joinGroupCall, leaveGroupCall, endGroupCall, rejectGroupCall,
        toggleLocalMic, toggleLocalCamera,
    };
};