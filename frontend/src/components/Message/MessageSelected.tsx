import { Copy, ForwardIcon, MoreVertical,Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface Props{
    onCancel : ()=> void;
    onDelete : ()=> void;
}

export const MessageSelected = ({onCancel,onDelete}:Props) => {
    return(<>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"
                className="h-7 w-7 transition bg-zinc-500 text-white">
                    <MoreVertical size={16}/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4"/>Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <ForwardIcon className="mr-2 h-4 w-4"/>Forward
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4"/>Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCancel}>
                    <X/>Cancel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>);
}