import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, UserPlus, Video } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface Props {
    open: boolean;
    accepted: boolean;
    user: any;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    friends: any[];
    onEnd: () => void;
    onInvite: (userId: string) => void;
    onSwitchToVideo: () => void;
}

export default function CallDialog({open,accepted,user,localStream,remoteStream,friends,onEnd,onInvite,onSwitchToVideo}: Props) {
    const [seconds, setSeconds] = useState(0);
    const [micEnabled, setMicEnabled] = useState(true);
    const [speakerMuted, setSpeakerMuted] = useState(false);
    const [audioScale, setAudioScale] = useState(1);

    // Call duration timer
    useEffect(() => {
        if (!accepted) {
            setSeconds(0);
            return;
        }
        const timer = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [accepted]);

    // Remote audio volume visualizer (voice frequency analyzer)
    useEffect(() => {
        if (!accepted || !remoteStream) {
            setAudioScale(1);
            return;
        }

        let audioCtx: AudioContext | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let analyser: AnalyserNode | null = null;
        let animationFrameId: number;

        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;

            source = audioCtx.createMediaStreamSource(remoteStream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateScale = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArray);

                let total = 0;
                for (let i = 0; i < bufferLength; i++) {
                    total += dataArray[i];
                }
                const average = total / bufferLength;

                // Scale value between 1 and 1.8 based on amplitude
                const newScale = 1 + (average / 150) * 0.8;
                setAudioScale(Math.min(newScale, 1.8));

                animationFrameId = requestAnimationFrame(updateScale);
            };

            updateScale();
        } catch (err) {
            console.error("Failed to run voice analyser:", err);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (source) source.disconnect();
            if (audioCtx) audioCtx.close();
        };
    }, [accepted, remoteStream]);

    // Update mic status based on local stream track
    useEffect(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            setMicEnabled(audioTrack ? audioTrack.enabled : true);
        }
    }, [localStream]);

    if (!open) return null;

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

    return (
        <div className="fixed inset-0 z-[999] flex flex-col bg-zinc-950 text-white select-none animate-in fade-in duration-300">
            {/* Header: Call Type and Status */}
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
                            {accepted ? "Voice Call Connected" : "Calling..."}
                        </span>
                    </div>
                </div>

                {accepted && (
                    <div className="px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-semibold tracking-wider tabular-nums shadow-md">
                        {formatTime(seconds)}
                    </div>
                )}
            </div>

            {/* Main Avatar / pulsing circle area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="relative">
                    {/* Ring Animations based on voice volume */}
                    {accepted && (
                        <>
                            <div 
                                className="absolute inset-0 rounded-full bg-green-500/10 transition-transform duration-100 ease-out" 
                                style={{ transform: `scale(${audioScale * 1.4})` }} 
                            />
                            <div 
                                className="absolute inset-0 rounded-full bg-green-500/5 transition-transform duration-100 ease-out" 
                                style={{ transform: `scale(${audioScale * 1.15})` }} 
                            />
                        </>
                    )}
                    
                    <Avatar className="h-32 w-32 border-4 border-zinc-800 shadow-2xl relative z-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-3xl font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {!micEnabled && (
                        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-650 border-2 border-zinc-905 text-white shadow-md z-20">
                            <MicOff className="h-4 w-4" />
                        </span>
                    )}
                </div>

                <h3 className="mt-8 text-xl font-semibold text-zinc-300">
                    {accepted ? "Active Audio Call" : "Calling..."}
                </h3>
            </div>

            {/* Bottom Controls Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-850 px-6 py-4 rounded-full shadow-2xl backdrop-blur-md">
                    {/* Toggle Mic */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMic}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${micEnabled
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                            }`}
                        title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    >
                        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Turn on Camera / Switch to Video call */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onSwitchToVideo}
                        className="h-12 w-12 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer transition-all duration-200"
                        title="Turn on Camera"
                    >
                        <Video className="h-5 w-5" />
                    </Button>

                    {/* Mute Speaker */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleSpeaker}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${!speakerMuted
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                            }`}
                        title={!speakerMuted ? "Mute Audio" : "Unmute Audio"}
                    >
                        {!speakerMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>

                    {/* Add Person dropdown (Only after accepting) */}
                    {accepted && (
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

            {/* Hidden audio element to actually play stream */}
            {accepted && localStream && <audio autoPlay className="hidden" />}
        </div>
    );
}