import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {Copy,Reply,Trash2,MoreVertical, Forward} from "lucide-react";
interface Props {
    isMe:boolean;
    onDelete:()=>void;
    onCopy:()=>void;
    onReply:()=>void;
    onForward:()=>void;
}
export default function MessageDropdown({onDelete,onCopy,onReply,onForward}:Props){
    return(
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-7 w-7 group transition`}>
                    <MoreVertical size={16}/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onReply}>
                    <Reply className="mr-2 h-4 w-4"/>Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                    <Copy className="mr-2 h-4 w-4"/>Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onForward}>
                    <Forward className="mr-2 h-4 w-4"/>forward
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4"/>Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}