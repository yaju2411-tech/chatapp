import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Phone, PhoneOff, Video } from "lucide-react";

interface GroupIncomingCallProps {
    open: boolean;
    caller?: {
        name: string;
        avatar?: string;
    };
    groupName: string;
    callType: "audio" | "video";
    onAccept: () => void;
    onReject: () => void;
}

export default function GroupIncomingCall({
    open,
    caller,
    groupName,
    callType,
    onAccept,
    onReject,
}: GroupIncomingCallProps) {
    if (!open || !caller) return null;
    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onReject(); }}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-6 flex flex-col items-center gap-6 shadow-2xl">
                <DialogTitle className="sr-only">Incoming Group Call</DialogTitle>
                <div className="relative mt-4">
                    {/* Pulsing ring animation */}
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                    <Avatar className="h-24 w-24 border-2 border-zinc-700 shadow-lg relative z-10">
                        <AvatarImage src={caller.avatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl font-bold">
                            {caller.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="text-center flex flex-col gap-1">
                    <h3 className="text-xl font-bold tracking-tight text-white">{caller.name}</h3>
                    <p className="text-sm text-zinc-400 font-semibold">
                        Calling you in <span className="text-green-400">{groupName}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Group {callType === "video" ? "Video" : "Voice"} Call...
                    </p>
                </div>

                <div className="flex items-center gap-8 w-full justify-center mt-2">
                    {/* Reject Button */}
                    <Button
                        onClick={onReject}
                        className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-750 text-white flex items-center justify-center p-0 shadow-lg shadow-red-655/30 transition-all hover:scale-105"
                    >
                        <PhoneOff className="h-6 w-6" />
                    </Button>
                    
                    {/* Accept Button */}
                    <Button
                        onClick={onAccept}
                        className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-750 text-white flex items-center justify-center p-0 shadow-lg shadow-green-655/30 transition-all hover:scale-105"
                    >
                        {callType === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
