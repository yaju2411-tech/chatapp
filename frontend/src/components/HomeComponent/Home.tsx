import * as React from "react";
import { Command} from "lucide-react";
import { NavUser } from "./Navbar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInput, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import AddFriendDialog from "../FriendComponent/AddFriendDialog";
import { DisplayFriend } from "../FriendComponent/DisplayRejectFriend";
import { useGetFriends, useRemoveFriends } from "@/hooks/chatHook/useFriendHook";
import { useConversations, useCreateConversation } from "@/hooks/chatHook/useConversation";
import FriendListItem from "../FriendComponent/FriendList";
import { socket } from "@/socket/socket";

export function Home({ setSelectedchat,selectedchat, ...props }: React.ComponentProps<typeof Sidebar> & { selectedchat: any; setSelectedchat: any;}) {
  const [search, setSearch] = React.useState("");
  const { data: friends = [] } = useGetFriends(search);
  const {data:conversations} = useConversations();
  const removeFriendMutation = useRemoveFriends();
  const createConversationMutation = useCreateConversation();
  const [onlineUsers,setOnlineUsers] = React.useState<string[]>([]);
  React.useEffect(() => {
    socket.on("online-users",(users)=>{
        setOnlineUsers(users);
    });
    return () => {
        socket.off("online-users");
    };
  },[]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* ICON SIDEBAR */}
      <Sidebar
        collapsible="none"
        className="hidden md:flex w-[calc(var(--sidebar-width-icon)+1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-5" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Tooltip>
            <TooltipTrigger>
              <div>
                <AddFriendDialog />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Add friend
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DisplayFriend />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Accept friend request
            </TooltipContent>
          </Tooltip>
        </SidebarHeader>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* CHAT LIST */}
      <Sidebar collapsible="none" className="w-full md:w-[350px] border-r">
        <SidebarHeader className="border-b p-4">
          <SidebarInput placeholder="Search Friends..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {friends.friends?.map((friend: any) => {
                const conversation = conversations?.conversations?.find((c: any) => c.members.some((m: any) => m._id === friend._id));
                return(<FriendListItem
                  key={friend._id} friend={friend} isOnline={onlineUsers.includes(friend._id)} 
                  unreadCount={conversation?.unreadCount || 0} conversationId={selectedchat}
                  onSelect={() => {
                    createConversationMutation.mutate(friend._id, {
                      onSuccess: (data) => {
                        setSelectedchat(data.conversation._id);
                  }});
                  }}
                  onDelete={() => {
                    removeFriendMutation.mutate(friend._id);
                  }}/>)
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}