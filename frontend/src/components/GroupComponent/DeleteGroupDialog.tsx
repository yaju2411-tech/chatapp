import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/authHook/useProfileHook";
import { useGroupInfo, useDeleteGroup, useLeaveGroup, useClearGroupChat } from "@/hooks/groupHook/useGroup";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteGroupDialogProps {
  conversationId: string | null;
  trigger: React.ReactNode;
  onSuccessAction?: () => void;
}

export const DeleteGroupDialog = ({ conversationId, trigger, onSuccessAction }: DeleteGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const { data: profileData } = useProfile();
  const currentUser = profileData?.user;

  const { data: groupData } = useGroupInfo(conversationId || "");
  const group = groupData?.group;

  const deleteGroupMutation = useDeleteGroup();
  const leaveGroupMutation = useLeaveGroup();
  const clearChatMutation = useClearGroupChat();

  const isCreator = currentUser?._id && (group?.createdBy?._id || group?.createdBy) === currentUser._id;

  if (!conversationId) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-[450px] bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle>Group Destruction Operations</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-zinc-400 text-sm">
            Please select a group conversation from the list first to delete, leave, or clear it.
          </div>
          <Button onClick={() => setOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const handleDelete = () => {
    deleteGroupMutation.mutate(conversationId, {
      onSuccess: () => {
        setOpen(false);
        if (onSuccessAction) onSuccessAction();
      },
    });
  };

  const handleLeave = () => {
    leaveGroupMutation.mutate(conversationId, {
      onSuccess: () => {
        setOpen(false);
        if (onSuccessAction) onSuccessAction();
      },
    });
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this group's chat history for all members?")) {
      clearChatMutation.mutate(conversationId, {
        onSuccess: () => {
          setOpen(false);
        },
      });
    }
  };

  return (<>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[450px] sm:max-w-[450px] bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6">
        <DialogHeader className="border-b border-zinc-800 pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />
            <span>Group Danger Zone</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Destructive actions for the group "{group?.groupName || "this conversation"}".
          </DialogDescription>
        </DialogHeader>

        <div className="py-5 space-y-4">
          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-lg flex gap-3 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Attention Required</p>
              <p className="mt-0.5 opacity-90">
                These actions cannot be undone. Please proceed with caution.
              </p>
            </div>
          </div>

          {isCreator ? (
            <div className="space-y-3">
              {/* Option A: Disband Group */}
              <div className="p-3 bg-zinc-900 border border-zinc-800/80 hover:border-rose-500/30 rounded-lg flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">Disband & Delete Group</p>
                  <p className="text-[10px] text-zinc-400">Permanently delete this group and all its files/chats.</p>
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={deleteGroupMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-3"
                >
                  {deleteGroupMutation.isPending ? "Disbanding..." : "Disband"}
                </Button>
              </div>

              {/* Option B: Clear Group Chat */}
              <div className="p-3 bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/30 rounded-lg flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">Clear Chat History</p>
                  <p className="text-[10px] text-zinc-400">Delete all message logs in this group for everyone.</p>
                </div>
                <Button
                  onClick={handleClearChat}
                  disabled={clearChatMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3"
                >
                  {clearChatMutation.isPending ? "Clearing..." : "Clear Chat"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Option C: Leave Group */}
              <div className="p-3 bg-zinc-900 border border-zinc-800/80 hover:border-rose-500/30 rounded-lg flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">Leave Group</p>
                  <p className="text-[10px] text-zinc-400">Exit the group conversation. You won't receive future messages.</p>
                </div>
                <Button
                  onClick={handleLeave}
                  disabled={leaveGroupMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-3"
                >
                  {leaveGroupMutation.isPending ? "Leaving..." : "Leave Group"}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="border-t border-zinc-800 pt-3 flex justify-end">
          <Button onClick={() => setOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>);
};
