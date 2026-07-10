import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Mic,MicOff,PhoneOff,Video,VideoOff,} from "lucide-react";

interface Props {
    open: boolean;
    accept: boolean;
    recover:boolean
    user: any;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onEnd: () => void;
}

export const VideoCall = ({open,accept,recover,user,localStream,remoteStream,onEnd,}: Props) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [seconds, setSeconds] = useState(0);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);

    useEffect(() => {
        if (!(accept && !recover)) {
            setSeconds(0);
            return;
        }
        const timer = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [accept, recover]);
    useEffect(() => {
        if (!localVideoRef.current) return;
        localVideoRef.current.srcObject = localStream;
    }, [localStream]);
    useEffect(() => {
        if (!remoteVideoRef.current) return;
        remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);
    useEffect(() => {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];
        setCameraEnabled(videoTrack?.enabled ?? false);
        setMicEnabled(audioTrack?.enabled ?? false);
    }, [localStream]);
    const toggleCamera = () => {
        if (!localStream) return;
        const track = localStream.getVideoTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setCameraEnabled(track.enabled);
    };
    const toggleMic = () => {
        if (!localStream) return;
        const track = localStream.getAudioTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setMicEnabled(track.enabled);
    };
    if (!open) return null;
    const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:` + `${String(seconds % 60).padStart(2, "0")}`;

    return (<>
        <div className="fixed inset-0 z-[9999] bg-black">
            {recover ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white">
                    <div className="text-center">
                        <p className="text-xl font-semibold">Reconnecting...</p>
                        <p className="text-zinc-400 mt-2">
                            Trying to restore your call
                        </p>
                    </div>
                </div>
            ) : remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline/>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white">
                    <img src={user?.avatar} className="h-28 w-28 rounded-full object-cover"/>
                    <h1 className="mt-5 text-3xl font-bold">{user?.name}</h1>
                    <p className="mt-3 text-zinc-400">Connecting...</p>
                </div>
            )}

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
            <div className="absolute left-6 top-6 text-white">
                <h2 className="text-2xl font-bold">
                    {user?.name}
                </h2>
                <p className="text-sm text-zinc-300">
                    {accept ? time : recover ? "Reconnecting..." : "Calling..."}
                </p>
            </div>
            <video ref={localVideoRef} muted autoPlay playsInline
            className="absolute right-6 top-6 h-36 w-48 rounded-2xl border border-white object-cover shadow-xl"/>
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-5">
                <Button size="icon" onClick={toggleMic}
                    className="h-14 w-14 rounded-full bg-zinc-800 hover:bg-zinc-700">
                    {micEnabled ? <Mic /> : <MicOff />}
                </Button>               
                <Button size="icon" onClick={toggleCamera}
                    className="h-14 w-14 rounded-full bg-zinc-800 hover:bg-zinc-700">
                    {cameraEnabled ? <Video /> : <VideoOff />}
                </Button>
                <Button size="icon" onClick={onEnd}
                    className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700">
                    <PhoneOff />
                </Button>
            </div>
        </div>
    </>);
};