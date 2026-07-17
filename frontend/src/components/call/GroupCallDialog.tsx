import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Mic, MicOff, PhoneOff, Video, VideoOff, UserPlus, Search, Check, X } from "lucide-react";

interface Participant {
    _id: string;
    name: string;
    avatar?: string;
    isVideoOff: boolean;
    isMuted: boolean;
}

interface GroupCallDialogProps {
    open: boolean;
    callType: "audio" | "video";
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    participants: Participant[];
    micEnabled: boolean;
    cameraEnabled: boolean;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    friends: any[];
    busyUsers: string[];
    onInviteUser: (targetUserId: string, targetUser: any) => void;
    onLeave: () => void;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    accepted: boolean;
}

const VideoStreamPlayer = ({ stream, muted }: { stream: MediaStream | null; muted: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current) {
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

const AudioPulseAvatar = ({
    stream,
    isMuted,
    avatar,
    fallbackName,
    size = "large",
}: {
    stream: MediaStream | null;
    isMuted: boolean;
    avatar?: string;
    fallbackName: string;
    size?: "small" | "large";
}) => {
    const [audioScale, setAudioScale] = useState(1);

    useEffect(() => {
        if (!stream || isMuted) {
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
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updatePulse = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const scale = 1 + (average / 255) * 0.8;
                setAudioScale(scale);

                animationFrameId = requestAnimationFrame(updatePulse);
            };

            updatePulse();
        } catch (e) {
            console.error("Audio analyser failed:", e);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (source) source.disconnect();
            if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
        };
    }, [stream, isMuted]);

    const dimensionClass = size === "large" ? "h-40 w-40 md:h-52 md:w-52" : "h-14 w-14";
    const ring1Class = size === "large" ? "inset-[-12px] md:inset-[-16px]" : "inset-[-6px]";
    const ring2Class = size === "large" ? "inset-[-24px] md:inset-[-32px]" : "inset-[-12px]";
    const textClass = size === "large" ? "text-5xl md:text-7xl" : "text-lg";

    return (
        <div className="relative flex items-center justify-center shrink-0">
            {/* Waveform pulse ring 1 */}
            <div
                style={{ transform: `scale(${audioScale})` }}
                className={`absolute rounded-full bg-green-500/10 border border-green-500/20 transition-transform duration-75 ease-out ${ring1Class}`}
            />
            {/* Waveform pulse ring 2 */}
            <div
                style={{ transform: `scale(${1 + (audioScale - 1) * 1.8})` }}
                className={`absolute rounded-full bg-green-500/5 border border-green-500/10 transition-transform duration-100 ease-out ${ring2Class}`}
            />

            <Avatar className={`${dimensionClass} border-2 border-zinc-700 shadow-xl relative z-10`}>
                <AvatarImage src={avatar} />
                <AvatarFallback className={`bg-zinc-800 text-zinc-300 font-bold ${textClass}`}>
                    {fallbackName.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
        </div>
    );
};

export default function GroupCallDialog({
    open,
    callType,
    localStream,
    remoteStreams,
    participants,
    micEnabled,
    cameraEnabled,
    currentUser,
    friends,
    busyUsers,
    onInviteUser,
    onLeave,
    onToggleMic,
    onToggleCamera,
    accepted,
}: GroupCallDialogProps) {
    const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteSearch, setInviteSearch] = useState("");

    if (!open) return null;

    const firstRemoteParticipant = participants.find((p) => p._id !== currentUser?._id);
    const activeFocusId = focusedParticipantId || firstRemoteParticipant?._id || currentUser?._id || "";
    const isFocusedSelf = activeFocusId === currentUser?._id;
    const focusedParticipant = participants.find((p) => p._id === activeFocusId);
    const focusedStream = isFocusedSelf ? localStream : (remoteStreams.get(activeFocusId) ?? null);
    const isFocusedVideoActive = isFocusedSelf
        ? (callType === "video" && cameraEnabled && focusedStream)
        : (focusedParticipant && !focusedParticipant.isVideoOff && focusedStream && focusedStream.getVideoTracks().length > 0);

    const filteredFriends = friends.filter((f) =>
        f.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
        f.email.toLowerCase().includes(inviteSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[8888] flex flex-col bg-zinc-950 text-white font-sans overflow-hidden">
            {/* Render top indicator if caller is waiting for peers */}
            {!accepted && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 border border-zinc-800 px-6 py-2.5 rounded-full flex items-center gap-3 backdrop-blur-md">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-zinc-300 text-sm font-semibold tracking-wide">
                        Calling group members...
                    </span>
                </div>
            )}

            {/* Google Meet style layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                {/* Main Focus View */}
                <div className="flex-1 flex items-center justify-center p-4 relative min-h-0 bg-zinc-950">
                    <div className="w-full h-full max-w-5xl max-h-[85%] aspect-video rounded-3xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-sm overflow-hidden relative shadow-2xl flex flex-col items-center justify-center">
                        {isFocusedVideoActive ? (
                            <VideoStreamPlayer stream={focusedStream} muted={true} />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                                    <AudioPulseAvatar
                                        stream={focusedStream}
                                        isMuted={isFocusedSelf ? !micEnabled : focusedParticipant?.isMuted || false}
                                        avatar={isFocusedSelf ? currentUser?.avatar : focusedParticipant?.avatar}
                                        fallbackName={isFocusedSelf ? "You" : focusedParticipant?.name || "User"}
                                        size="large"
                                    />
                                    <span className="text-zinc-500 text-xs font-semibold bg-zinc-950/60 px-3 py-1 rounded-full">
                                        Camera Off
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="absolute z-20 bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-md border border-white/5 flex items-center gap-2">
                            <span className="font-semibold text-xs">
                                {isFocusedSelf ? "You" : focusedParticipant?.name}
                            </span>
                            {(isFocusedSelf ? !micEnabled : focusedParticipant?.isMuted) && (
                                <MicOff className="text-red-500 h-3.5 w-3.5" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right/Bottom Sidebar scroll list */}
                <div className="w-full md:w-80 h-32 md:h-full border-t md:border-t-0 md:border-l border-zinc-850 bg-zinc-950/20 p-2 md:p-4 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex flex-row md:flex-col gap-4 no-scrollbar shrink-0">
                    {participants.map((p) => {
                        const isSelf = p._id === currentUser?._id;
                        const stream = (isSelf ? localStream : remoteStreams.get(p._id)) ?? null;
                        const isVideoActive = isSelf
                            ? (callType === "video" && cameraEnabled && stream)
                            : (p && !p.isVideoOff && stream && stream.getVideoTracks().length > 0);

                        return (
                            <div
                                key={p._id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setFocusedParticipantId(p._id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setFocusedParticipantId(p._id);
                                    }
                                }}
                                className={`w-36 md:w-full aspect-video rounded-xl bg-zinc-900 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center relative shrink-0 ${
                                    p._id === activeFocusId
                                        ? "border-green-500 shadow-md ring-1 ring-green-500/50"
                                        : "border-zinc-800 hover:border-zinc-700"
                                }`}
                            >
                                {isVideoActive ? (
                                    <VideoStreamPlayer stream={stream} muted={true} />
                                ) : (
                                    <div className="relative flex flex-col items-center gap-1.5 z-10 scale-90">
                                        <AudioPulseAvatar
                                            stream={stream}
                                            isMuted={isSelf ? !micEnabled : p.isMuted}
                                            avatar={p.avatar}
                                            fallbackName={p.name}
                                            size="small"
                                        />
                                    </div>
                                )}
                                <div className="absolute z-20 bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-md backdrop-blur-sm border border-white/5 flex items-center gap-1 max-w-[85%]">
                                    <span className="font-semibold text-[10px] truncate">
                                        {isSelf ? "You" : p.name}
                                    </span>
                                    {(isSelf ? !micEnabled : p.isMuted) && (
                                        <MicOff className="text-red-500 h-2.5 w-2.5 shrink-0" />
                                    )}
                                </div>

                                {!isSelf && stream && (
                                    <audio
                                        ref={(el) => {
                                            if (el) el.srcObject = stream;
                                        }}
                                        autoPlay
                                        muted={false}
                                        style={{ display: "none" }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-850 px-6 py-4 rounded-full shadow-2xl backdrop-blur-md">
                    {/* Toggle Mic */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onToggleMic}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            micEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                        title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    >
                        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Toggle Video */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onToggleCamera}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${
                            cameraEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-550 text-white hover:bg-red-600"
                        }`}
                        title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                    >
                        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>

                    <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

                    {/* Add Person Button */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsInviteOpen(true)}
                        className="h-12 w-12 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer transition-all duration-200"
                        title="Add Person"
                    >
                        <UserPlus className="h-5 w-5" />
                    </Button>

                    <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

                    {/* End Call Button */}
                    <Button
                        size="icon"
                        onClick={onLeave}
                        className="h-12 w-12 rounded-full bg-red-650 text-white hover:bg-red-750 hover:scale-105 transition-all duration-250 cursor-pointer shadow-lg shadow-red-650/20"
                        title="Leave Call"
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Invite Dialog overlay */}
            {isInviteOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[425px] bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Close call"
                            onClick={() => setIsInviteOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white rounded-full cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </Button>

                        <div className="flex flex-col gap-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-green-400" />
                                <span>Invite Participant</span>
                            </h3>
                        </div>

                        <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-300 mt-4">
                            <Search className="h-4 w-4 text-zinc-500 mr-2" />
                            <Input
                                placeholder="Search friends by name or email..."
                                value={inviteSearch}
                                onChange={(e) => setInviteSearch(e.target.value)}
                                className="bg-transparent border-0 outline-none text-sm p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-500 text-white"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto flex flex-col gap-2 mt-4 pr-1 scrollbar-thin">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map((f) => {
                                    const isMemberInCall = participants.some((p) => p._id === f._id);
                                    return (
                                        <div
                                            key={f._id}
                                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-zinc-700">
                                                    <AvatarImage src={f.avatar} />
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-bold">
                                                        {f.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold truncate max-w-[180px]">{f.name}</span>
                                                    <span className="text-[10px] text-zinc-400 truncate max-w-[180px]">{f.email}</span>
                                                </div>
                                            </div>

                                            {isMemberInCall ? (
                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                    <Check className="h-3 w-3 text-zinc-500" />
                                                    <span>Active</span>
                                                </span>
                                            ) : busyUsers.includes(f._id) ? (
                                                <span className="text-[10px] bg-red-700/80 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                    <span>Busy</span>
                                                </span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        onInviteUser(f._id, f);
                                                        setIsInviteOpen(false);
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-[11px] px-3 py-1 h-7 rounded-full cursor-pointer"
                                                >
                                                    Invite
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <span className="text-zinc-500 text-xs text-center py-6">No matching friends found</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
