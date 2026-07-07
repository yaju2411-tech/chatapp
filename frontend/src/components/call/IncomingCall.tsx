import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

interface Props {
    open: boolean;
    caller: any;
    callType: "audio" | "video";
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingCallDialog({open,caller,callType,onAccept,onReject,}: Props) {
    if (!open) return null;
    return (<>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            <div className="w-[340px] rounded-3xl bg-zinc-900 p-8 text-center shadow-2xl">
                <Avatar className="mx-auto h-24 w-24">
                    <AvatarImage src={caller?.avatar} />
                </Avatar>
                <h2 className="mt-4 text-2xl text-white font-semibold">{caller?.name}</h2>
                <p className="mt-2 text-zinc-400">Incoming {callType === "video" ? "Video" : "Voice"} Call</p>
                <div className="mt-8 flex justify-center gap-8">
                    <Button size="icon" onClick={onReject} className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700">
                        <PhoneOff />
                    </Button>
                    <Button size="icon" onClick={onAccept} className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700">
                        {callType === "video" ? <Video /> : <Phone />}
                    </Button>
                </div>
            </div>
        </div>
    </>);
}