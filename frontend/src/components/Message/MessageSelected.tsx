import { Copy, ForwardIcon, MoreVertical,Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";
import { ForwardMessage } from "./ForwardMessage";

interface Props{
    onCancel : ()=> void;
    onDelete : ()=> void;
    onCopy : ()=> void;
    setSelectionMode : any;
    selectedMessages : string[];
}

export const MessageSelected = ({onCancel,onDelete,onCopy,setSelectionMode,selectedMessages}:Props) => {
    const [openForward,setOpenForward] = useState(false);
    return(<>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"
                className="h-7 w-7 transition bg-zinc-500 text-white">
                    <MoreVertical size={16}/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={()=>{onCopy;setSelectionMode(false)}}>
                    <Copy className="mr-2 h-4 w-4"/>Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenForward(true)}>
                    <ForwardIcon className="mr-2 h-4 w-4"/>
                    Forward
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4"/>Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCancel}>
                    <X/>Cancel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <ForwardMessage open={openForward} onClose={() => setOpenForward(false)} messageIds={selectedMessages}/>
    </>);
}