import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, VolumeX, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface Props {
    open: boolean;
    accept: boolean;
    recover: boolean;
    user: any;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    friends: any[];
    onEnd: () => void;
    onInvite: (userId: string) => void;
}

export const VideoCall = ({
    open,
    accept,
    recover,
    user,
    localStream,
    remoteStream,
    friends,
    onEnd,
    onInvite,
}: Props) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [seconds, setSeconds] = useState(0);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [speakerMuted, setSpeakerMuted] = useState(false);

    // Call duration timer
    useEffect(() => {
        if (!(accept && !recover)) {
            setSeconds(0);
            return;
        }
        const timer = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [accept, recover]);

    // Attach stream objects to video tags
    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Update track state flags
    useEffect(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];
            setCameraEnabled(videoTrack ? videoTrack.enabled : true);
            setMicEnabled(audioTrack ? audioTrack.enabled : true);
        }
    }, [localStream]);

    const toggleCamera = () => {
        if (localStream) {
            const track = localStream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setCameraEnabled(track.enabled);
            }
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const track = localStream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setMicEnabled(track.enabled);
            }
        }
    };

    const toggleSpeaker = () => {
        setSpeakerMuted((prev) => !prev);
    };

    const formatTime = (totalSecs: number) => {
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        return `${mins}:${secs}`;
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999] flex flex-col bg-zinc-950 text-white select-none animate-in fade-in duration-300">
            
            {/* Top Bar Info */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{user?.name}</h2>
                        <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
                            {recover ? "Reconnecting..." : accept ? "Connected" : "Calling..."}
                        </span>
                    </div>
                </div>

                {accept && !recover && (
                    <div className="px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-semibold tracking-wider tabular-nums shadow-md">
                        {formatTime(seconds)}
                    </div>
                )}
            </div>

            {/* Video Streams Grid */}
            <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden">
                {recover ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-20 backdrop-blur-sm">
                        <div className="text-center">
                            <span className="flex h-3 w-3 mx-auto mb-4 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-duration-1000"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <p className="text-xl font-bold tracking-wide">Reconnecting...</p>
                            <p className="text-zinc-400 mt-2 text-sm">Attempting to restore your connection</p>
                        </div>
                    </div>
                ) : null}

                {/* Remote Stream (Main Background) */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center">
                        <Avatar className="h-28 w-28 border-4 border-zinc-800 shadow-2xl">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-3xl font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-6 text-xl font-semibold tracking-tight">{user?.name}</h3>
                        <p className="mt-2 text-zinc-400 text-sm">Connecting video stream...</p>
                    </div>
                )}

                {/* Local Camera (Floating PIP Card) */}
                {localStream && (
                    <div className="absolute right-6 top-24 w-40 h-56 md:w-48 md:h-64 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900 z-30 transition-all duration-300">
                        {cameraEnabled ? (
                            <video
                                ref={localVideoRef}
                                muted
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover transform -scale-x-100"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                                <Avatar className="h-14 w-14 border border-zinc-800 shadow-md">
                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm font-bold">
                                        You
                                    </AvatarFallback>
                                </Avatar>
                                <span className="mt-2 text-[10px] text-zinc-500 font-medium">Camera Off</span>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-semibold tracking-wider">
                            You
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Controls Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent z-40">
                <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-850 px-6 py-4 rounded-full shadow-2xl backdrop-blur-md">
                    
                    {/* Toggle Mic */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMic}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            micEnabled
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                        title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    >
                        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Toggle Camera */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleCamera}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            cameraEnabled
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                        title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                    >
                        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>

                    {/* Mute Speaker */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleSpeaker}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            !speakerMuted
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                        title={!speakerMuted ? "Mute Audio" : "Unmute Audio"}
                    >
                        {!speakerMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>

                    {/* Add Person dropdown (Only after accepting) */}
                    {accept && !recover && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-12 w-12 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer transition-all duration-200"
                                        title="Add Person"
                                    >
                                        <UserPlus className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="z-[1000] w-56 bg-zinc-900 border border-zinc-800 text-white max-h-60 overflow-y-auto no-scrollbar">
                                    <div className="p-2 text-xs font-semibold text-zinc-400 border-b border-zinc-850">
                                        Invite Friends
                                    </div>
                                    {(() => {
                                        const nonParticipants = friends.filter(
                                            (friend) => friend._id !== user?._id
                                        );
                                        return nonParticipants.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-zinc-500">
                                                No friends available
                                            </div>
                                        ) : (
                                            nonParticipants.map((friend) => (
                                                <DropdownMenuItem
                                                    key={friend._id}
                                                    onClick={() => onInvite(friend._id)}
                                                    className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-md cursor-pointer text-sm"
                                                >
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={friend.avatar} />
                                                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                                                            {friend.name?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate">{friend.name}</span>
                                                </DropdownMenuItem>
                                            ))
                                        );
                                    })()}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-[1px] h-6 bg-zinc-800 mx-2" />
                        </>
                    )}

                    {/* End Call */}
                    <Button
                        size="icon"
                        onClick={onEnd}
                        className="h-12 w-12 rounded-full bg-red-650 text-white hover:bg-red-750 hover:scale-105 transition-all duration-250 cursor-pointer shadow-lg shadow-red-600/20"
                        title="End Call"
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};