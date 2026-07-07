import { useEffect, useRef, useState } from "react"

interface UseWebRTCProps{
    socket:any;
    currentUser:any;
    otherUser:any;
}

export const useWebRTC = ({socket,currentUser,otherUser}:UseWebRTCProps) => {
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const [localMedia, setLocalMedia] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [calling, setCalling] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callType, setCallType] = useState<"audio" | "video" | null>(null);
    const callTypeRef = useRef<"audio" | "video">("audio");
    const incomingCallRef = useRef<any>(null);
    const otherUserRef = useRef<any>(null);
    const targetUserRef = useRef<string | null>(null);
    const gettingMediaRef = useRef(false);

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
        const handleCallEnded = () => {
            cleanup();
            setCalling(false);
            setCallAccepted(false);
            setIncomingCall(null);
            incomingCallRef.current = null;
        }
        const handleOffer = async({offer}:{offer:RTCSessionDescriptionInit}) => {
            const callerId = incomingCallRef.current?.caller?._id;
            if(!callerId) return;
            createPeerConnection((candidate)=>{
                socket.emit("ice-candidate",{
                    targetUserId:callerId,candidate
                });
            });
            await getLocalStream(callTypeRef.current);
            addLocalTracks();
            const answer = await createAnswer(offer);
            socket.emit("webrtc-answer",{
                targetUserId:callerId,answer
            });
        };
        const handleAnswer = async ({answer,}: {answer: RTCSessionDescriptionInit;}) => {
            await setRemoteAnswer(answer);
        };
        const handleIceCandidate = async ({candidate,}: {candidate: RTCIceCandidateInit;}) => {
            await addIceCandidate(candidate);
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("call-rejected", handleCallRejected);
        socket.on("call-ended", handleCallEnded);
        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);

        return () => {
            console.log("webrtc-unmounted");
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("call-rejected", handleCallRejected);
            socket.off("call-ended", handleCallEnded);
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
        };
    },[]);

    //functions for start,end,reject,accept call
    const startCall = async(type:"audio"|"video") => {
        if(!otherUser) return;
        targetUserRef.current = otherUser._id;
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
        setCallAccepted(false);
    } 
    const acceptCall = () => {
        if (!incomingCallRef.current) return;
        socket.emit("accept-call", {
            callerId: incomingCallRef.current.caller._id,
        });
        targetUserRef.current = incomingCallRef.current.caller._id;
        setCalling(true);
        setCallAccepted(true);
        setIncomingCall(null);
    };
    const rejectCall = () => {
        if(!incomingCallRef.current) return;
        socket.emit("reject-call",{
            callerId:incomingCallRef.current.caller._id,
        });
        cleanup();
        setIncomingCall(null);
        setCalling(false);
        setCallAccepted(false);
        incomingCallRef.current = null;
        targetUserRef.current = null;
    };
    const endCall = () => {
        if(!targetUserRef.current){
            cleanup(); return;
        }
        socket.emit("end-call",{
            receiverId:targetUserRef.current
        });
        cleanup();
        setIncomingCall(null);
        setCalling(false);
        setCallAccepted(false);
        targetUserRef.current = null;
        incomingCallRef.current = null;
    }
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
            console.log("RemoteTrack",event.track.kind);
            setRemoteStream(event.streams[0]);
        };
        pc.onconnectionstatechange = () => {
            console.log("Connections",pc.connectionState)
            if(pc.connectionState==="failed"){
                console.log("Connections failed");
                cleanup();
            }
            if(pc.connectionState==="closed"){
                console.log("Connections closed")
                cleanup();
            }
            if(pc.connectionState==="disconnected"){
                console.log("Disconnected");
            }
        };
        pc.oniceconnectionstatechange = () => {
            console.log("ICE",pc.iceConnectionState)
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
            return;
        }
        gettingMediaRef.current = true
        try{
                console.log("Before getUserMedia");
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
            console.log("Before getUserMedia")
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
        const offer = await peerConnection.current.createOffer({
            offerToReceiveAudio:true,
            offerToReceiveVideo:true,
        });
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
        if(peerConnection.current.remoteDescription){
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
        setRemoteStream(null);
        setLocalMedia(null);
    }

    return {
        endCall,startCall,remoteStream,incomingCall,localStream:localMedia,
        acceptCall,rejectCall,callAccepted,calling,callType
    };
}