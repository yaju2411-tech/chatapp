import { useState } from "react";
import { SidebarHeader, SidebarInput, SidebarContent, SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversations } from "@/hooks/chatHook/useConversation";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { UpdateGroupDialog } from "./UpdateGroupDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { PlusCircle, Settings, Users, X } from "lucide-react";

interface GroupSidebarProps {
  selectedchat: any;
  setSelectedchat: (id: any) => void;
}

export const GroupSidebar = ({ selectedchat, setSelectedchat }: GroupSidebarProps) => {
  const [search, setSearch] = useState("");
  const { data: conversationsData } = useConversations();
  const conversations = conversationsData?.conversations || [];

  // Filter conversations where isGroup is true and matches search query
  const groupConversations = conversations
    .filter((c: any) => c.isGroup)
    .filter((c: any) => c.groupName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 text-white">
      {/* SVG Linear Gradient definitions for icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="create-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          <linearGradient id="update-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="delete-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
      </svg>

      {/* 3 Danger & Management Option Cards */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950/20 border-b border-zinc-900 flex-shrink-0">
        <CreateGroupDialog
          trigger={
            <button className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-850/80 shadow-md">
                <PlusCircle className="h-7 w-7 transition-transform group-hover:scale-110 duration-200" stroke="url(#create-grad)" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">Create</span>
            </button>
          }
        />

        <UpdateGroupDialog
          conversationId={selectedchat}
          trigger={
            <button className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-850/80 shadow-md">
                <Settings className="h-7 w-7 transition-transform group-hover:rotate-45 duration-300" stroke="url(#update-grad)" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">Update</span>
            </button>
          }
        />

        <DeleteGroupDialog
          conversationId={selectedchat}
          trigger={
            <button className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-850/80 shadow-md">
                <X className="h-7 w-7 transition-transform group-hover:scale-110 duration-200" stroke="url(#delete-grad)" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">Delete</span>
            </button>
          }
          onSuccessAction={() => setSelectedchat(null)}
        />
      </div>

      {/* Search Groups bar */}
      <SidebarHeader className="border-b border-zinc-900/40 p-4 flex-shrink-0">
        <SidebarInput
          placeholder="Search Groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs h-9 focus-visible:ring-zinc-700"
        />
      </SidebarHeader>

      {/* Groups List */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupContent>
            {groupConversations.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs py-8">
                No group conversations found
              </div>
            ) : (
              groupConversations.map((groupConv: any) => {
                const isSelected = selectedchat === groupConv._id;
                return (
                  <div
                    key={groupConv._id}
                    onClick={() => setSelectedchat(groupConv._id)}
                    className={`flex items-center gap-3 p-4 border-b border-zinc-900/45 cursor-pointer transition-all hover:bg-zinc-900/40 ${isSelected ? "bg-zinc-900 text-indigo-400 font-semibold" : "text-zinc-200"
                      }`}
                  >
                    <Avatar className="h-10 w-10 border border-zinc-800">
                      <AvatarImage src={groupConv.groupAvatar} alt={groupConv.groupName} />
                      <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs">
                        <Users className="h-4 w-4 text-indigo-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{groupConv.groupName}</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {groupConv.lastMessage || groupConv.description || `${groupConv.members?.length || 0} members`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {groupConv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white text-[10px] flex items-center justify-center font-semibold">
                          {groupConv.unreadCount}
                        </div>
                      )}
                      <span className="text-[9px] text-zinc-500">
                        {groupConv.lastMessageAt
                          ? new Date(groupConv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );
};
