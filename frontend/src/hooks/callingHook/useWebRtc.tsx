import { useEffect, useRef, useState } from "react"

interface UseWebRTCProps{
    socket:any;
    currentUser:any;
    otherUser:any;
}

export const useWebRTC = ({socket,currentUser,otherUser}:UseWebRTCProps) => {
    const [callAccepted, setCallAccepted] = useState(false);
    const [callType, setCallType] = useState<"audio" | "video" | null>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [calling, setCalling] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localMedia, setLocalMedia] = useState<MediaStream | null>(null);
    const [recovering, setRecovering] = useState(false);
    const [transitioningToGroup, setTransitioningToGroup] = useState<{ callType: "audio" | "video" } | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const callTypeRef = useRef<"audio" | "video">("audio");
    const gettingMediaRef = useRef(false);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const targetUserRef = useRef<string | null>(null);
    const otherUserRef = useRef<any>(null);
    const incomingCallRef = useRef<any>(null);
    const isCallerRef = useRef(false);

    //if user do refresh then 
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!calling || !targetUserRef.current) return;
                sessionStorage.setItem("active-call",JSON.stringify({
                    targetUserId: targetUserRef.current,
                    callType: callTypeRef.current,
                    isCaller:isCallerRef.current
            }));
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [calling]);
    useEffect(() => {
        const activeCall = sessionStorage.getItem("active-call");
        if (!activeCall) return;
        const data = JSON.parse(activeCall);
        targetUserRef.current = data.targetUserId;
        callTypeRef.current = data.callType;
        isCallerRef.current = data.isCaller;
        setCallType(data.callType);
        setCalling(true);
        setRecovering(true);
        setCallAccepted(true);
        sessionStorage.removeItem("active-call");
        socket.emit("recover-call", {
            targetUserId: data.targetUserId,
            callType: data.callType,
        });
    }, []);
    useEffect(() => {
        const handleRecovering = async ({ callType }: any) => {
            callTypeRef.current = callType;
            setCalling(true);
            setRecovering(true);
            cleanupPeer();
            createPeerConnection(candidate => {socket.emit("ice-candidate", {
                targetUserId: targetUserRef.current,candidate,});
            });
            await getLocalStream(callType);
            addLocalTracks();
            if (!isCallerRef.current) {
                socket.emit("recover-ready", {
                    targetUserId: targetUserRef.current,
                });
            }
        };
        const handleRestartWebRTC = async () => {
            setCalling(true);
            setRecovering(true);
            cleanupPeer();
            createPeerConnection(candidate => {socket.emit("ice-candidate", {
                    targetUserId: targetUserRef.current,
                    candidate,
                });
            });
            await getLocalStream(callTypeRef.current);
            addLocalTracks();
            if (isCallerRef.current) {
                const offer = await createOffer();
                socket.emit("webrtc-offer", {
                    targetUserId: targetUserRef.current,
                    offer,
                });
            }
            else {
                console.log("Recovered receiver -> waiting for offer");
            }
        };
        socket.on("call-recovering", handleRecovering);
        socket.on("restart-webrtc", handleRestartWebRTC);
        return () => {
            socket.off("call-recovering", handleRecovering);
            socket.off("restart-webrtc", handleRestartWebRTC);
        };
    }, []);

    useEffect(()=>{
        otherUserRef.current = otherUser;
    },[otherUser]);
    useEffect(()=>{
        const handleIncomingCall = (data:any) => {
            incomingCallRef.current = data;
            setIncomingCall(data);
            setCallType(data.callType);
            callTypeRef.current = data.callType;
        }
        const handleCallAccepted = async () => {
            if(recovering) return;
            setCalling(true);
            setCallAccepted(true);
            const offer = await createOffer();
            socket.emit("webrtc-offer", {
                targetUserId: targetUserRef.current,
                offer,
            });
        };
        const handleCallRejected = () => {
            cleanup();
            setCalling(false);
            setCallAccepted(false);
            setIncomingCall(null);
            incomingCallRef.current = null;
        }
        const handleCallEnded = (data?: any) => {
            cleanup();
            setCalling(false);
            setCallAccepted(false);
            setIncomingCall(null);
            incomingCallRef.current = null;
            if (data?.transitioning) {
                setTransitioningToGroup({ callType: data.callType || "audio" });
            }
        }
        const handleOffer = async({offer}:{offer:RTCSessionDescriptionInit}) => {
            const callerId = targetUserRef.current;
            if(!callerId) return;
            if(!peerConnection.current){
                createPeerConnection((candidate)=>{
                    socket.emit("ice-candidate",{
                        targetUserId:callerId,candidate
                    });
                });
            }
            if (!localStream.current) {
                await getLocalStream(callTypeRef.current);
                addLocalTracks();
            }
            const answer = await createAnswer(offer);
            socket.emit("webrtc-answer",{
                targetUserId:callerId,answer
            });
        };
        const handleAnswer = async ({answer,}: {answer: RTCSessionDescriptionInit;}) => {
            await setRemoteAnswer(answer);
            if(recovering){
                setRecovering(false);
            }
        };
        const handleIceCandidate = async ({candidate,}: {candidate: RTCIceCandidateInit;}) => {
            await addIceCandidate(candidate);
        };
        const handleSwitchToVideo = async () => {
            callTypeRef.current = "video";
            setCallType("video");
            if (localStream.current) {
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 1280, height: 720 }
                    });
                    const videoTrack = videoStream.getVideoTracks()[0];
                    if (videoTrack) {
                        localStream.current.addTrack(videoTrack);
                        peerConnection.current?.addTrack(videoTrack, localStream.current);
                    }
                } catch (err) {
                    console.error("Failed to add video track on switch:", err);
                }
            }
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("call-rejected", handleCallRejected);
        socket.on("call-ended", handleCallEnded);
        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("switch-to-video-call", handleSwitchToVideo);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("call-rejected", handleCallRejected);
            socket.off("call-ended", handleCallEnded);
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("switch-to-video-call", handleSwitchToVideo);
        };
    },[]);
    
    //refresh functions
    const cleanupPeer = () => {
        if (peerConnection.current) {
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;
            peerConnection.current.getSenders().forEach(sender => {
                peerConnection.current?.removeTrack(sender);
            });
            peerConnection.current.close();
            peerConnection.current = null;
        }
        pendingCandidates.current = [];
    };
    const cleanupCall = () => {
        cleanupPeer();
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        setLocalMedia(null);
        callTypeRef.current = "audio";
        targetUserRef.current = null;
        incomingCallRef.current = null;
        setCalling(false);
        setCallAccepted(false);
        setRecovering(false);
        setIncomingCall(null);
    };
    //functions for start,end,reject,accept call
    const startCall = async(type:"audio"|"video") => {
        if(!otherUser) return;
        targetUserRef.current = otherUser._id;
        isCallerRef.current = true;
        callTypeRef.current = type;
        setCallType(type);
        createPeerConnection((candidate)=>{
            socket.emit("ice-candidate",{
                targetUserId:targetUserRef.current,candidate
            });
        });
        await getLocalStream(type);
        addLocalTracks();
        socket.emit("call-user",{
            receiverId:otherUser._id,
            caller:currentUser,
            callType:type
        });
        setCalling(true);
        setRecovering(false);
        setCallAccepted(false);
    } 
    const acceptCall = (type?: "audio" | "video") => {
        console.log("Role = Receiver");
        if (!incomingCallRef.current) return;
        if (type) {
            callTypeRef.current = type;
            setCallType(type);
        }
        socket.emit("accept-call", {
            callerId: incomingCallRef.current.caller._id,
        });
        targetUserRef.current = incomingCallRef.current.caller._id;
        isCallerRef.current = false;
        setCalling(true);
        setCallAccepted(true);
        setRecovering(false);
        setIncomingCall(null);
    };
    const rejectCall = () => {
        if(!incomingCallRef.current) return;
        socket.emit("reject-call",{
            callerId:incomingCallRef.current.caller._id,
        });
        cleanupCall();
    };
    const endCall = (transitioning = false, transCallType?: "audio" | "video") => {
        if (targetUserRef.current) {
            socket.emit("end-call", {
                receiverId: targetUserRef.current,
                transitioning,
                callType: transCallType
            });
        }
        cleanupCall();
    };
    //make google stun connection stun:stun.l.google.com:19302 with WebRTC
    const createPeerConnection = (onIceCandidate ?: (candidate:RTCIceCandidate) => void) => {
        if(peerConnection.current){
            return peerConnection.current;
        }
        const pc = new RTCPeerConnection({
            iceServers:[{
                urls:[
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            },{
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
        pc.onicecandidate = (event) => {
            if(event.candidate && onIceCandidate){
                onIceCandidate(event.candidate);
            }
        };
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            setRemoteStream(stream);
        };
        pc.onconnectionstatechange = () => {
            if (peerConnection.current !== pc) return;
            if (pc.connectionState === "connected") {
                setRecovering(false);
            }
            if (pc.connectionState === "failed") {
                console.log("Peer failed");
            }
            if (pc.connectionState === "closed") {
                console.log("Peer closed");
            }
            if(pc.connectionState==="disconnected"){
                console.log("Disconnected");
            }
        };
        pc.oniceconnectionstatechange = () => {
            if (peerConnection.current !== pc) return;
            console.log("ICE",pc.iceConnectionState);
        }
        peerConnection.current = pc;
        return pc;
    }
    //get localStream ,asks for allow voice and camera then start calling
    const getLocalStream = async(type:"audio"|"video") => {
        if(localStream.current){
            return localStream.current;
        }
        if(gettingMediaRef.current){
            while(gettingMediaRef.current){
                await new Promise(resolve => setTimeout(resolve,100));
            }
            return localStream.current;
        }
        gettingMediaRef.current = true
        try{
                const stream = await navigator.mediaDevices.getUserMedia({
                audio:{
                    echoCancellation:true,
                    noiseSuppression:true,
                    autoGainControl:true
                },
                video: type==="video" ? { width:1280,height:720 } : false
            });
            localStream.current = stream;
            setLocalMedia(stream);
            (window as any).testStream = stream;
            return stream;
        }
        finally{
            gettingMediaRef.current = false;
        }
    }
    //add microphone for talking
    const addLocalTracks = () => {
        if(!peerConnection.current) return;
        if(!localStream.current) return;
        const senders = peerConnection.current.getSenders();
        localStream.current.getTracks().forEach((track)=>{
            const alreadyAdded = senders.find(sender => sender.track?.id === track.id);
            if(!alreadyAdded){
                peerConnection.current!.addTrack(track,localStream.current!)
            }
        })
    }
    //it is used for connect via IP adress from browser a to b. details of browser like ip,supports are called offer
    const createOffer = async() => {
        if(!peerConnection.current){
            throw new Error("Peer not connected");
        }
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        return offer;
    }
    //make answer 
    const createAnswer = async(offer:RTCSessionDescriptionInit) => {
        if(!peerConnection.current){
            throw new Error("Peer not created");
        }
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        while(pendingCandidates.current.length){
            const candidate = pendingCandidates.current.shift();
            if(candidate){
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
        return answer;
    }
    //set answer
    const setRemoteAnswer = async(answer:RTCSessionDescriptionInit) => {
        if(!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        while(pendingCandidates.current.length){
            const candidate = pendingCandidates.current.shift();
            if(candidate){
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    }
    //make ice candidate to receive
    const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
        if(!peerConnection.current) return;
        if(peerConnection.current.remoteDescription &&
            peerConnection.current.remoteDescription.type){
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        else{
            pendingCandidates.current.push(candidate);
        }
    };
    //cleanup after end call
    const cleanup = async() => {
        if(localStream.current){
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if(peerConnection.current){
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;
            peerConnection.current.getSenders().forEach(sender=>{
                peerConnection.current?.removeTrack(sender);
            });
            peerConnection.current.close();
            peerConnection.current = null;
        }
        pendingCandidates.current = [];
        callTypeRef.current = "audio",
        isCallerRef.current = false;
        setLocalMedia(null);
        setRemoteStream(null);
        setRecovering(false);
    }

    const switchToVideo = async () => {
        if (!peerConnection.current || !localStream.current) return;
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            const videoTrack = videoStream.getVideoTracks()[0];
            if (videoTrack) {
                localStream.current.addTrack(videoTrack);
                peerConnection.current.addTrack(videoTrack, localStream.current);
            }
            callTypeRef.current = "video";
            setCallType("video");
            
            socket.emit("switch-to-video-call", {
                receiverId: targetUserRef.current
            });

            const offer = await createOffer();
            socket.emit("webrtc-offer", {
                targetUserId: targetUserRef.current,
                offer
            });
        } catch (err) {
            console.error("Failed to switch to video:", err);
        }
    };
    
    return {
        endCall,startCall,remoteStream,incomingCall,localStream:localMedia,
        acceptCall,rejectCall,callAccepted,calling,callType,recovering,switchToVideo,
        transitioningToGroup, setTransitioningToGroup
    };
}