import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, LucideBrushCleaning, MoreVertical, PenBox, Plus, Trash2, User2} from "lucide-react";

interface Props {
    friend: any;
    onDelete: () => void;
    onClearChat: () => void;
}

export default function FriendDropdown({ friend, onDelete, onClearChat}: Props) {
    return (<>
        <DropdownMenu>
            <DropdownMenuTrigger asChild> 
                <Button size="icon-sm" variant="outline" className="rounded-full bg-zinc-800 text-white">
                    <MoreVertical /> 
                </Button> 
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full">
                <DropdownMenuItem>
                    <Plus/><p>Add To Group</p>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <PenBox/><p>Edit</p>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Eye/><p>See Details</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">
                    <Trash2/><p>Delete Chat</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={onClearChat}>
                    <LucideBrushCleaning/><p>Clear Chat</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                    <User2/><p>Delete Friend</p>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>);
}
