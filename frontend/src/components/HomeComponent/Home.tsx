import * as React from "react";
import { Command, MessageSquare, Users, Settings } from "lucide-react";
import { NavUser } from "./Navbar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInput } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { DisplayFriend } from "../FriendComponent/DisplayRejectFriend";
import { useGetFriends, useRemoveFriends } from "@/hooks/chatHook/useFriendHook";
import { useConversations, useCreateConversation } from "@/hooks/chatHook/useConversation";
import FriendListItem from "../FriendComponent/FriendList";
import { socket } from "@/socket/socket";
import { AddFriendDialog } from "../FriendComponent/AddFriendDialog";
import { Button } from "@/components/ui/button";

export function Home({ setSelectedchat, selectedchat, ...props }: React.ComponentProps<typeof Sidebar> & { selectedchat: any; setSelectedchat: any; }) {
  const [search, setSearch] = React.useState("");
  const { data: friends = [] } = useGetFriends(search);
  const { data: conversations } = useConversations();
  const removeFriendMutation = useRemoveFriends();
  const createConversationMutation = useCreateConversation();
  const [onlineUsers, setOnlineUsers] = React.useState<string[]>([]);
  React.useEffect(() => {
    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.off("online-users");
    };
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* ICON SIDEBAR */}
      <Sidebar
        collapsible="none"
        className="hidden md:flex w-[calc(var(--sidebar-width-icon)+1px)] border-r bg-zinc-950 border-zinc-900"
      >
        <SidebarHeader className="flex flex-col items-center justify-center py-4 border-b border-zinc-900 flex-shrink-0">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Command className="size-5 animate-pulse" />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col items-center gap-2 py-2 flex-1 no-scrollbar justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                <MessageSquare />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Chats
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                <Users />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Groups
            </TooltipContent>
          </Tooltip>

          {/* Action Dialogs */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center w-full">
                <AddFriendDialog />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Add friend
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center w-full">
                <DisplayFriend />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Accept friend request
            </TooltipContent>
          </Tooltip>
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center gap-1 flex-shrink-0 border-t border-zinc-900">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                <Settings />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
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
                return (<FriendListItem
                  key={friend._id} friend={friend} isOnline={onlineUsers.includes(friend._id)}
                  unreadCount={conversation?.unreadCount || 0} conversationId={selectedchat}
                  onSelect={() => {
                    createConversationMutation.mutate(friend._id, {
                      onSuccess: (data) => {
                        setSelectedchat(data.conversation._id);
                      }
                    });
                  }}
                  onDelete={() => {
                    removeFriendMutation.mutate(friend._id);
                  }} />)
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}