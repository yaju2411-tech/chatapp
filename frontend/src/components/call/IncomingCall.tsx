import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

interface Props {
    open: boolean;
    caller: any;
    callType: "audio" | "video";
    onAccept: (type: "audio" | "video") => void;
    onReject: () => void;
    isGroup?: boolean;
    groupName?: string;
    groupAvatar?: string;
}

export default function IncomingCallDialog({
    open,
    caller,
    callType,
    onAccept,
    onReject,
    isGroup = false,
    groupName = "Group Call",
    groupAvatar,
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-[380px] rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 text-center shadow-2xl backdrop-blur-md transform scale-95 animate-in zoom-in-95 duration-200">
                {isGroup ? (
                    <div className="relative mx-auto h-24 w-24">
                        {/* Double avatar presentation: Group Avatar with Caller Avatar overlaid */}
                        <Avatar className="h-24 w-24 border-2 border-zinc-700 shadow-md">
                            <AvatarImage src={groupAvatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl font-bold">
                                {groupName?.charAt(0).toUpperCase() || "G"}
                            </AvatarFallback>
                        </Avatar>
                        <Avatar className="absolute -bottom-2 -right-2 h-10 w-10 border-2 border-zinc-900 shadow-md">
                            <AvatarImage src={caller?.avatar} />
                            <AvatarFallback className="bg-zinc-700 text-white text-sm font-semibold">
                                {caller?.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <Avatar className="mx-auto h-24 w-24 border-2 border-zinc-700 shadow-md">
                        <AvatarImage src={caller?.avatar} />
                        <AvatarFallback className="bg-zinc-850 text-zinc-300 text-2xl font-bold">
                            {caller?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                )}

                <h2 className="mt-6 text-2xl text-white font-bold tracking-tight">
                    {isGroup ? groupName : caller?.name}
                </h2>
                <p className="mt-2 text-zinc-400 text-sm">
                    {isGroup 
                        ? `${caller?.name} is inviting you to a group ${callType === "video" ? "video" : "audio"} call...`
                        : `Incoming ${callType === "video" ? "Video" : "Voice"} Call`
                    }
                </p>

                {isGroup && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
                            Active Call in Progress
                        </span>
                    </div>
                )}

                <div className="mt-8 flex justify-center items-center gap-4">
                    {/* Decline / Reject call */}
                    <Button
                        size="icon"
                        onClick={onReject}
                        className="h-16 w-16 rounded-full bg-red-650 text-white shadow-lg hover:bg-red-700 hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Decline Call"
                    >
                        <PhoneOff className="h-6 w-6" />
                    </Button>

                    {/* Accept as Audio */}
                    <Button
                        size="icon"
                        onClick={() => onAccept("audio")}
                        className="h-16 w-16 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Accept with Audio Only"
                    >
                        <Phone className="h-6 w-6" />
                    </Button>

                    {/* Accept as Video (only if the call type supports video, or if it's a group call where video is optional) */}
                    {(callType === "video" || isGroup) && (
                        <Button
                            size="icon"
                            onClick={() => onAccept("video")}
                            className="h-16 w-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 cursor-pointer"
                            title="Accept with Video"
                        >
                            <Video className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}