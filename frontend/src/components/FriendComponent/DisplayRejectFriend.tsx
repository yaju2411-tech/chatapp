import { VerifiedIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAcceptFriendRequest, usePendingRequests, useRejectFriendRequest } from "@/hooks/chatHook/useFriendHook";

export const DisplayFriend = () => {
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();
    const requests = usePendingRequests();
    return(<>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <VerifiedIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Friend Requests</DialogTitle>
                </DialogHeader>
                {requests.data?.map((request:any)=>(
                    <div key={request._id} className="flex items-center gap-3 border p-3 rounded">
                        <Avatar>
                            <AvatarImage src={request.sender.avatar}/>
                            <AvatarFallback>{request.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p>{request.sender.name}</p>
                            <p className="text-xs text-zinc-400">{request.sender.email}</p>
                        </div>
                        <Button size="sm"
                        onClick={()=>acceptMutation.mutate(request._id)}>
                        Accept</Button>
                        <Button variant="destructive" size="sm"
                        onClick={()=>rejectMutation.mutate(request._id)}>
                        Reject</Button>
                    </div>
                ))}
            </DialogContent>
        </Dialog>
    </>);
}