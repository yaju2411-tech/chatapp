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

interface CallDialogProps {
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
    onInviteUser: (targetUserId: string, targetUser: any) => void;
    onLeave: () => void;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    accepted: boolean;
}

// Sub-component to bind MediaStream to a video element
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

// Sub-component to handle audio visualization and display avatar pulsing rings
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

            const updateScale = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArray);

                let total = 0;
                for (let i = 0; i < bufferLength; i++) {
                    total += dataArray[i];
                }
                const average = total / bufferLength;

                // Scale value between 1 and 1.8 based on volume amplitude
                const newScale = 1 + (average / 150) * 0.8;
                setAudioScale(Math.min(newScale, 1.8));

                animationFrameId = requestAnimationFrame(updateScale);
            };

            updateScale();
        } catch (err) {
            console.error("Failed to run audio visualizer analyser:", err);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (source) source.disconnect();
            if (audioCtx) audioCtx.close();
        };
    }, [stream, isMuted]);

    const avatarSizeClass = size === "small" ? "h-12 w-12" : "h-24 w-24";
    const fontClass = size === "small" ? "text-sm" : "text-3xl";
    const ringsOffsetClass = size === "small" ? 1.35 : 1.55;
    const ringsInnerClass = size === "small" ? 1.15 : 1.25;

    return (
        <div className="relative">
            {audioScale > 1.02 && (
                <>
                    <div
                        className="absolute inset-0 rounded-full bg-green-500/20 transition-transform duration-100 ease-out"
                        style={{ transform: `scale(${audioScale * ringsOffsetClass})` }}
                    />
                    <div
                        className="absolute inset-0 rounded-full bg-green-500/10 transition-transform duration-100 ease-out"
                        style={{ transform: `scale(${audioScale * ringsInnerClass})` }}
                    />
                </>
            )}
            <Avatar className={`border-2 border-zinc-700 shadow-md relative z-10 ${avatarSizeClass}`}>
                <AvatarImage src={avatar} />
                <AvatarFallback className={`bg-zinc-800 text-zinc-300 font-bold ${fontClass}`}>
                    {fallbackName.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
        </div>
    );
};

export default function CallDialog({
    open,
    callType,
    localStream,
    remoteStreams,
    participants,
    micEnabled,
    cameraEnabled,
    currentUser,
    friends,
    onInviteUser,
    onLeave,
    onToggleMic,
    onToggleCamera,
    accepted,
}: CallDialogProps) {
    const [seconds, setSeconds] = useState(0);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteSearch, setInviteSearch] = useState("");
    const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);

    // Call duration timer
    useEffect(() => {
        if (!open || !accepted) {
            setSeconds(0);
            return;
        }
        const timer = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [open, accepted]);

    if (!open) return null;

    const formatTime = (totalSecs: number) => {
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const isGroup = participants.length > 2;

    // Filter remote participants (excluding current local user)
    const remoteParticipants = participants.filter((p) => p._id !== currentUser?._id);

    // Resolve caller representation for header / title
    const callTitle = isGroup
        ? "Group Call"
        : (remoteParticipants[0]?.name || "Call");

    const callAvatar = remoteParticipants[0]?.avatar;

    // --- layout logic ---
    // 1-to-1 PIP variables
    const remoteUser = remoteParticipants[0];
    const remoteStream = remoteUser ? remoteStreams.get(remoteUser._id) : null;
    const isRemoteVideoActive = remoteStream && remoteStream.getVideoTracks().length > 0 && remoteStream.getVideoTracks()[0].enabled;
    const isLocalVideoActive = callType === "video" && cameraEnabled && localStream;

    // Group grid variables
    const activeFocusId = focusedParticipantId && participants.some((p) => p._id === focusedParticipantId)
        ? focusedParticipantId
        : (remoteParticipants[0]?._id || currentUser?._id || "local");

    const focusedParticipant = participants.find((p) => p._id === activeFocusId) || participants[0];
    const isFocusedSelf = focusedParticipant?._id === currentUser?._id;
    const focusedStream = isFocusedSelf ? localStream : remoteStreams.get(focusedParticipant?._id);
    const isFocusedVideoActive = isFocusedSelf
        ? (callType === "video" && cameraEnabled && focusedStream)
        : (focusedParticipant && !focusedParticipant.isVideoOff && focusedStream && focusedStream.getVideoTracks().length > 0);

    // Filter friends list to exclude members already in call
    const filteredFriends = friends.filter((f) => {
        const matchesSearch = f.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
            f.email.toLowerCase().includes(inviteSearch.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[999] flex flex-col bg-zinc-950 text-white select-none animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    {!isGroup && callAvatar ? (
                        <Avatar className="h-10 w-10 border border-zinc-700">
                            <AvatarImage src={callAvatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold">
                                {callTitle.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="flex -space-x-3 items-center">
                            {remoteParticipants.slice(0, 3).map((p, idx) => (
                                <Avatar
                                    key={p._id}
                                    className="h-8 w-8 border-2 border-zinc-950 shadow-md rounded-full"
                                    style={{ zIndex: 3 - idx }}
                                >
                                    <AvatarImage src={p.avatar} />
                                    <AvatarFallback className="bg-zinc-850 text-zinc-350 text-[10px] font-bold">
                                        {p.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {remoteParticipants.length > 3 && (
                                <div className="h-8 w-8 rounded-full bg-zinc-850 border-2 border-zinc-950 flex items-center justify-center text-[10px] text-zinc-300 font-bold z-0 shadow-md">
                                    +{remoteParticipants.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{callTitle}</h2>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            {!accepted ? (
                                <span className="font-semibold text-green-400 animate-pulse">
                                    Calling...
                                </span>
                            ) : (
                                <>
                                    <span className="font-semibold text-zinc-400">Connected ({participants.length})</span>
                                    <span>•</span>
                                    <span className="font-semibold text-green-400">
                                        {callType === "video" ? "Video Call" : "Voice Call"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Add Person (Invite) Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={participants.length >= 6}
                        onClick={() => setIsInviteOpen(true)}
                        className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 text-xs font-semibold px-3 py-1.5 flex items-center gap-2 rounded-full cursor-pointer transition-all duration-200"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Person</span>
                        <span className="text-[10px] text-zinc-450 bg-zinc-800 px-1.5 py-0.5 rounded-full ml-0.5">
                            {participants.length}/6
                        </span>
                    </Button>

                    {accepted && (
                        <div className="px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-semibold tracking-wider tabular-nums shadow-md">
                            {formatTime(seconds)}
                        </div>
                    )}
                </div>
            </div>

            {/* Calling Screen Area */}
            {!isGroup ? (
                // 1-to-1 PIP Layout
                <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-32 relative overflow-hidden">
                    {/* Main Container - Remote user */}
                    <div className="relative w-full h-full max-w-4xl aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shadow-lg overflow-hidden">
                        {isRemoteVideoActive ? (
                            <VideoStreamPlayer stream={remoteStream} muted={false} />
                        ) : (
                            <>
                                <div
                                    className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 transition-all duration-500"
                                    style={{ backgroundImage: `url(${remoteUser?.avatar || ""})` }}
                                />
                                <div className="relative flex flex-col items-center gap-3 z-10">
                                    <AudioPulseAvatar
                                        stream={remoteStream}
                                        isMuted={remoteUser?.isMuted ?? false}
                                        avatar={remoteUser?.avatar}
                                        fallbackName={remoteUser?.name || "User"}
                                        size="large"
                                    />
                                    <span className="text-zinc-400 text-[10px] font-medium bg-zinc-950/40 px-2 py-0.5 rounded-md mt-1">
                                        Camera Off
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Remote Info overlay */}
                        <div className="absolute z-20 bottom-3 left-3 px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-md border border-white/5 flex items-center gap-2">
                            <span className="font-semibold text-xs">{remoteUser?.name}</span>
                            {remoteUser?.isMuted && <MicOff className="text-red-500 h-3 w-3" />}
                        </div>

                        {/* Remote Audio Track loop */}
                        {remoteStream && (
                            <audio
                                ref={(el) => {
                                    if (el) el.srcObject = remoteStream;
                                }}
                                autoPlay
                                muted={false}
                                style={{ display: "none" }}
                            />
                        )}
                    </div>

                    {/* Local User PIP */}
                    <div className="absolute bottom-6 right-6 w-40 md:w-52 aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 z-30">
                        {isLocalVideoActive ? (
                            <VideoStreamPlayer stream={localStream} muted={true} />
                        ) : (
                            <>
                                <div
                                    className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-10 transition-all duration-500"
                                    style={{ backgroundImage: `url(${currentUser?.avatar || ""})` }}
                                />
                                <div className="relative flex flex-col items-center gap-1.5 z-10">
                                    <AudioPulseAvatar
                                        stream={localStream}
                                        isMuted={!micEnabled}
                                        avatar={currentUser?.avatar}
                                        fallbackName={currentUser?.name || "You"}
                                        size="small"
                                    />
                                </div>
                            </>
                        )}
                        <div className="absolute z-20 bottom-2 left-2 px-2 py-1 bg-black/60 rounded-md backdrop-blur-md border border-white/5 flex items-center gap-1.5">
                            <span className="font-semibold text-[10px]">You</span>
                            {!micEnabled && <MicOff className="text-red-500 h-2.5 w-2.5" />}
                        </div>
                    </div>
                </div>
            ) : (
                // Group Grid/Sidebar Layout
                <div className="flex-1 flex flex-col md:flex-row p-6 pt-24 pb-32 gap-6 overflow-hidden">
                    {/* Left: Large Focused Video Screen */}
                    <div className="flex-1 flex items-center justify-center min-h-[40vh] md:min-h-0 bg-zinc-900/30 rounded-2xl relative overflow-hidden border border-zinc-900">
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {isFocusedVideoActive ? (
                                <VideoStreamPlayer stream={focusedStream} muted={isFocusedSelf} />
                            ) : (
                                <>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-15 transition-all duration-500"
                                        style={{ backgroundImage: `url(${focusedParticipant?.avatar || ""})` }}
                                    />
                                    <div className="relative flex flex-col items-center gap-4 z-10">
                                        <AudioPulseAvatar
                                            stream={focusedStream}
                                            isMuted={isFocusedSelf ? !micEnabled : focusedParticipant?.isMuted}
                                            avatar={focusedParticipant?.avatar}
                                            fallbackName={focusedParticipant?.name || "User"}
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

                    {/* Right: Participants Sidebar Scroll List */}
                    <div className="w-full md:w-80 h-32 md:h-full border-t md:border-t-0 md:border-l border-zinc-850 bg-zinc-950/20 p-2 md:p-4 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex flex-row md:flex-col gap-4 no-scrollbar shrink-0">
                        {participants.map((p) => {
                            const isSelf = p._id === currentUser?._id;
                            const stream = isSelf ? localStream : remoteStreams.get(p._id);
                            const isVideoActive = isSelf
                                ? (callType === "video" && cameraEnabled && stream)
                                : (p && !p.isVideoOff && stream && stream.getVideoTracks().length > 0);

                            return (
                                <div
                                    key={p._id}
                                    onClick={() => setFocusedParticipantId(p._id)}
                                    className={`w-36 md:w-full aspect-video rounded-xl bg-zinc-900 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center relative shrink-0 ${p._id === activeFocusId ? "border-green-500 shadow-md ring-1 ring-green-500/50" : "border-zinc-800 hover:border-zinc-700"
                                        }`}
                                >
                                    {isVideoActive ? (
                                        <VideoStreamPlayer stream={stream} muted={isSelf} />
                                    ) : (
                                        <div className="relative flex flex-col items-center gap-1.5 z-10 scale-90">
                                            <AudioPulseAvatar
                                                stream={stream}
                                                isMuted={isSelf ? !micEnabled : (stream ? (stream.getAudioTracks().length === 0 || !stream.getAudioTracks()[0].enabled) : p.isMuted)}
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
                                        {(isSelf ? !micEnabled : (stream ? (stream.getAudioTracks().length === 0 || !stream.getAudioTracks()[0].enabled) : p.isMuted)) && (
                                            <MicOff className="text-red-500 h-2.5 w-2.5 shrink-0" />
                                        )}
                                    </div>

                                    {/* Remote Group Audio Element loop */}
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
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-850 px-6 py-4 rounded-full shadow-2xl backdrop-blur-md">
                    {/* Toggle Microphone */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onToggleMic}
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${micEnabled
                            ? "bg-zinc-800 text-white hover:bg-zinc-700"
                            : "bg-red-550 text-white hover:bg-red-600"
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
                        className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-200 ${cameraEnabled
                            ? "bg-zinc-800 text-white hover:bg-zinc-700"
                            : "bg-red-550 text-white hover:bg-red-600"
                            }`}
                        title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                    >
                        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>

                    <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

                    {/* End Call Button */}
                    <Button
                        size="icon"
                        onClick={onLeave}
                        className="h-12 w-12 rounded-full bg-red-650 text-white hover:bg-red-750 hover:scale-105 transition-all duration-250 cursor-pointer shadow-lg shadow-red-650/20"
                        title="End Call"
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Invite Dialog overlay */}
            {isInviteOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                    <div className="w-full max-w-[425px] bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
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

                        {/* Search Friends */}
                        <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-300 mt-4">
                            <Search className="h-4 w-4 text-zinc-500 mr-2" />
                            <Input
                                placeholder="Search friends by name or email..."
                                value={inviteSearch}
                                onChange={(e) => setInviteSearch(e.target.value)}
                                className="bg-transparent border-0 outline-none text-sm p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-500 text-white"
                            />
                        </div>

                        {/* List Friends */}
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
