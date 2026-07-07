import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { PhoneOff } from "lucide-react";

interface Props {
    open: boolean;
    accepted: boolean;
    user: any;
    onEnd: () => void;
}

export default function CallDialog({
    open,
    accepted,
    user,
    onEnd,
}: Props) {

    const [seconds, setSeconds] = useState(0);

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

    if (!open) return null;

    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return (<>
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
            <div className="w-[340px] rounded-3xl bg-zinc-900 p-8 shadow-2xl text-center">
                <Avatar className="mx-auto h-28 w-28">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback />
                </Avatar>
                <h1 className="mt-5 text-2xl font-semibold text-white">{user?.name}</h1>
                <p className="mt-3 text-zinc-400">{accepted ? "Connected" : "Calling..."}</p>
                {accepted && (
                    <p className="mt-2 text-green-400">{minutes}:{secs}</p>
                )}
                <Button onClick={onEnd} size="icon" className="mt-8 h-14 w-14 rounded-full bg-red-600 hover:bg-red-700">
                    <PhoneOff />
                </Button>
            </div>
        </div>
    </>);
}