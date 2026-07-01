import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { PhoneOff } from "lucide-react";

interface Props{
    open:boolean;
    accepted:boolean;
    user:any;
    onEnd:()=>void;
}
export default function CallDialog({open,accepted,user,onEnd,}:Props){
    if(!open) return null;
    return(<>
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
            <div className="w-[340px] rounded-3xl bg-zinc-900 p-8 text-center shadow-2xl">
                <Avatar className="mx-auto h-28 w-28">
                    <AvatarImage src={user?.avatar}/>
                    <AvatarFallback/>
                </Avatar>
                <h2 className="mt-5 text-2xl text-white font-semibold">{user?.name}</h2>
                <p className="mt-3 text-zinc-400">{accepted ? "Connected" : "Calling..."}</p>
                {accepted && (
                    <p className="text-green-400 mt-2">00:00</p>
                )}
                <div className="mt-8">
                    <Button size="icon" onClick={onEnd} className="rounded-full h-14 w-14 bg-red-600 hover:bg-red-700">
                        <PhoneOff/>
                    </Button>
                </div>
            </div>
        </div>
    </>);
}