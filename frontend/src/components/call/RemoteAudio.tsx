import { useEffect, useRef } from "react";

export const RemoteAudio = ({ stream }: { stream: MediaStream | null }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (!audioRef.current || !stream) return;
        audioRef.current.srcObject = stream;
        audioRef.current.play().then(() => console.log("Playing Remote Audio")).catch(console.error);
    }, [stream]);
    return (<audio ref={audioRef} autoPlay playsInline/>);
};