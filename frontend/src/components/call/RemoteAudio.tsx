import { useEffect, useRef } from "react";

interface Props {
    stream: MediaStream | null;
}

export const RemoteAudio = ({ stream }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = stream ?? null;
        audioRef.current.play().catch(() => {});
    }, [stream]);
    return (
        <audio ref={audioRef} autoPlay playsInline/>
    );
};