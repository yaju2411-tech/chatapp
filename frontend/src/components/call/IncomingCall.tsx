import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

interface Props{
    open:boolean;
    caller:any;
    onAccept:()=>void;
    onReject:()=>void;
}

export default function IncomingCallDialog({open,caller,onAccept,onReject}:Props){
    if(!open) return null;
    return(<>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-zinc-900 rounded-2xl p-8 w-[340px] text-center">
                <Avatar className="mx-auto h-24 w-24"><AvatarImage src={caller.avatar}/></Avatar>
                <h2 className="text-white text-xl mt-4">{caller.name}</h2>
                <p className="text-zinc-400 mt-2">Incoming Voice Call...</p>
                <div className="flex justify-center gap-6 mt-8">
                    <Button size="icon" className="rounded-full bg-red-600" onClick={()=>{ onReject();}}> 
                        <PhoneOff/></Button>
                    <Button size="icon" className="rounded-full bg-green-600" onClick={()=>{ onAccept();}}>
                        <Phone/></Button>
                </div>
            </div>
        </div>
    </>);
}