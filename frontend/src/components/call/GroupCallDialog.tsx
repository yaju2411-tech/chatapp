import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, VolumeX, Users, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface Participant {
    _id: string;
    name: string;
    avatar: string;
    email?: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
}

interface Props {
    open: boolean;
    callType: "audio" | "video";
    groupName: string;
    groupAvatar?: string;
    isGroup: boolean;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    participants: Participant[];
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    };
    friends: {
        _id: string;
        name: string;
        avatar?: string;
    }[];
    onInviteUser: (userId: string) => void;
    onLeave: () => void;
    onToggleMic: () => void;
    onToggleCamera: () => void;
}

// Sub-component to bind MediaStream to a video element
const VideoStreamPlayer = ({ stream, muted }: { stream: MediaStream | null; muted: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-cover rounded-2xl bg-zinc-950"
        />
    );
};

export default function GroupCallDialog({
    open,
    callType,
    groupName,
    groupAvatar,
    isGroup,
    localStream,
    remoteStreams,
    participants,
    currentUser,
    friends,
    onInviteUser,
    onLeave,
    onToggleMic,
    onToggleCamera,
}: Props) {
    const [seconds, setSeconds] = useState(0);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false); // Local speakers mute
    const isMaxReached = !isGroup && participants.length >= 5;

    // Handle Call duration timer
    useEffect(() => {
        if (!open) {
            setSeconds(0);
            return;
        }
        const timer = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [open]);

    // Update local control states when localStream is ready
    useEffect(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];
            setCameraEnabled(videoTrack ? videoTrack.enabled : callType === "video");
            setMicEnabled(audioTrack ? audioTrack.enabled : true);
        }
    }, [localStream, callType]);

    if (!open) return null;

    const toggleCamera = () => {
        onToggleCamera();
        setCameraEnabled(prev => !prev);
    };

    const toggleMic = () => {
        onToggleMic();
        setMicEnabled(prev => !prev);
    };

    const formatTime = (totalSecs: number) => {
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        return `${mins}:${secs}`;
    };

    // Calculate dynamic grid columns based on participant count
    const getGridClass = (count: number) => {
        if (count <= 1) return "grid-cols-1 max-w-2xl";
        if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl";
        if (count <= 4) return "grid-cols-2 max-w-4xl";
        return "grid-cols-2 md:grid-cols-3 max-w-5xl";
    };

    return (
        <div className="fixed inset-0 z-[999] flex flex-col bg-zinc-950 text-white select-none animate-in fade-in duration-300">
            {/* Header: Info and Timer */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={groupAvatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold">
                            {groupName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{groupName}</h2>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {participants.length} in call
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-green-400">
                                {callType === "video" ? "Video Call" : "Voice Call"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-semibold tracking-wider tabular-nums shadow-md">
                    {formatTime(seconds)}
                </div>
            </div>

            {/* Main participant streams area */}
            <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-32">
                <div className={`grid gap-6 w-full ${getGridClass(participants.length)} transition-all duration-300`}>
                    {participants.map((p) => {
                        const isSelf = p._id === currentUser._id;
                        const isFriend = isSelf || friends.some(f => f._id === p._id);
                        const displayName = isSelf 
                            ? p.name 
                            : isFriend 
                                ? p.name 
                                : (p.email || p.name);
                        const stream = isSelf ? localStream : remoteStreams.get(p._id);
                        
                        // Check if video is enabled for this stream
                        const videoTrack = stream?.getVideoTracks()[0];
                        const showVideo = callType === "video" && stream && videoTrack && videoTrack.enabled;

                        return (
                            <div
                                key={p._id}
                                className="relative aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center shadow-lg transition-transform duration-200 hover:scale-[1.01]"
                            >
                                {showVideo ? (
                                    <VideoStreamPlayer stream={stream} muted={isSelf || isAudioMuted} />
                                ) : (
                                    <>
                                        {/* Background blur profile picture for ambient visual effect */}
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 transition-all duration-500" 
                                            style={{ backgroundImage: `url(${p.avatar || ""})` }}
                                        />

                                        {/* Center avatar card */}
                                        <div className="relative flex flex-col items-center gap-3 z-10">
                                            <div className="relative">
                                                <Avatar className="h-20 w-20 border-2 border-zinc-700 shadow-md">
                                                    <AvatarImage src={p.avatar} />
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xl font-bold">
                                                        {displayName?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Microphone muted status on avatar */}
                                                {p.isMuted && (
                                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-zinc-900 text-white shadow-sm">
                                                        <MicOff className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-zinc-400 text-xs font-medium bg-zinc-950/40 px-2 py-0.5 rounded-md">
                                                Camera Off
                                            </span>
                                        </div>

                                        {/* Play remote audio in background via hidden video element */}
                                        {!isSelf && stream && (
                                            <div className="hidden">
                                                <VideoStreamPlayer stream={stream} muted={isAudioMuted} />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Bottom Name overlay */}
                                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
                                    <span className="text-xs font-semibold">
                                        {displayName} {isSelf && "(You)"}
                                    </span>
                                    {isSelf && !micEnabled && (
                                        <MicOff className="h-3 w-3 text-red-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-850 px-6 py-4 rounded-full shadow-2xl backdrop-blur-md">
                    {/* Toggle Microphone */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMic}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            micEnabled
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                    >
                        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Toggle Video (only for Video Call) */}
                    {callType === "video" && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleCamera}
                            className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                                cameraEnabled
                                    ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                    : "bg-red-550 text-white hover:bg-red-600"
                            }`}
                        >
                            {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>
                    )}

                    {/* Mute speaker audio (only for remote streams) */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsAudioMuted(!isAudioMuted)}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            !isAudioMuted
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                    >
                        {!isAudioMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>

                    {/* Add Person to Call */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={isMaxReached}>
                            <Button
                                size="icon"
                                variant="ghost"
                                disabled={isMaxReached}
                                className={`h-12 w-12 rounded-full text-white cursor-pointer transition-all duration-200 ${
                                    isMaxReached
                                        ? "opacity-40 cursor-not-allowed bg-zinc-900"
                                        : "bg-zinc-800 hover:bg-zinc-700"
                                }`}
                                title={isMaxReached ? "Maximum 5 participants reached" : "Add Person"}
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
                                    (friend) => !participants.some((p) => p._id === friend._id)
                                );
                                return nonParticipants.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-zinc-500">
                                        No friends available
                                    </div>
                                ) : (
                                    nonParticipants.map((friend) => (
                                        <DropdownMenuItem
                                            key={friend._id}
                                            onClick={() => onInviteUser(friend._id)}
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

                    {/* End Call / Leave Group Call */}
                    <Button
                        size="icon"
                        onClick={onLeave}
                        className="h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all duration-250 cursor-pointer shadow-lg shadow-red-600/20"
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
