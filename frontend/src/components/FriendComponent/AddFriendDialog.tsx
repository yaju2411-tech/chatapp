import { useState } from "react";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchUser } from "@/hooks/authHook/useProfileHook";
import { Plus, SearchIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSendFriendRequest } from "@/hooks/chatHook/useFriendHook";
import { toast } from "sonner";

export default function AddFriendDialog() {
  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const searchMutation = useSearchUser();
  const sendFriendMutation = useSendFriendRequest();

  const handleSearch = () => {
    searchMutation.mutate(search,{
        onSuccess:(data)=>{
            setFoundUser(data.user);
        }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Plus/>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
            <div className="flex gap-4">
                <Input
                    placeholder="Enter email..."
                    value={search} required={true}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button className="" onClick={handleSearch}>
                    <SearchIcon/>
                </Button>
            </div>
          {foundUser && (
            <div className="flex items-center gap-3 border rounded-sm p-3">
                <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={foundUser?.avatar} alt={foundUser?.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p>{foundUser?.name}</p>
                    <p className="text-xs text-zinc-400">{foundUser?.email}</p>
                </div>
                <TooltipProvider>  
                <Tooltip>  
                  <TooltipTrigger>
                    <div>
                      <Button
                        onClick={()=>{ 
                        sendFriendMutation.mutate(foundUser._id,{
                            onSuccess:()=>{
                                toast.success("Friend request sent",{position:"top-center"});
                            }
                        })
                    }}>
                    {sendFriendMutation.isPending ? "Sending..." : <Plus/>}
                    </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Add friend  
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}