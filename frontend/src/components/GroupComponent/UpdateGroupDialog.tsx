import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/authHook/useProfileHook";
import { useGetFriends } from "@/hooks/chatHook/useFriendHook";
import { uploadImage } from "@/service/cloudinary";
import QRCode from "react-qr-code";
import {
  useGroupInfo,
  useUpdateGroupInfo,
  useUpdateGroupSettings,
  useAddGroupMember,
  useRemoveGroupMember,
  useMakeGroupAdmin,
  useRemoveGroupAdmin,
  useTransferGroupOwnership,
  useGenerateInviteLink,
} from "@/hooks/groupHook/useGroup";
import { Settings, UserPlus, UserMinus, ShieldAlert, ShieldCheck, Crown, MoreVertical, Link2, Copy, RefreshCw, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UpdateGroupDialogProps {
  conversationId: string | null;
  trigger: React.ReactNode;
}

export const UpdateGroupDialog = ({ conversationId, trigger }: UpdateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "members" | "settings" | "invite">("info");

  // Local Form States
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [searchMember, setSearchMember] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: profileData } = useProfile();
  const currentUser = profileData?.user;

  // Group Details Query
  const { data: groupData, isLoading: isGroupLoading } = useGroupInfo(conversationId || "");
  const group = groupData?.group;

  // Friends Query
  const { data: friendsData } = useGetFriends("");
  const friendsList = friendsData?.friends || [];

  // Mutations
  const updateInfoMutation = useUpdateGroupInfo();
  const updateSettingsMutation = useUpdateGroupSettings();
  const addMemberMutation = useAddGroupMember();
  const removeMemberMutation = useRemoveGroupMember();
  const makeAdminMutation = useMakeGroupAdmin();
  const removeAdminMutation = useRemoveGroupAdmin();
  const transferOwnershipMutation = useTransferGroupOwnership();
  const generateInviteMutation = useGenerateInviteLink();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Populate local states when group info loads
  useEffect(() => {
    if (group) {
      setGroupName(group.groupName || "");
      setDescription(group.description || "");
      setAvatarPreview(group.groupAvatar || "");
      setAvatarFile(null);
    }
  }, [group]);

  if (!conversationId) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-[500px] bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle>Update Group Settings</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-zinc-400 text-sm">
            Please select a group conversation from the list first to modify its settings.
          </div>
          <Button onClick={() => setOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const creatorId = group?.createdBy?._id || group?.createdBy;
  const isCreator = currentUser?._id && creatorId === currentUser._id;
  const isAdmin = group?.admins?.some((admin: any) => (admin._id || admin) === currentUser?._id);

  const canEditInfo = !group?.groupSettings?.onlyAdminsCanEditInfo || isAdmin || isCreator;
  const canAddMembers = !group?.groupSettings?.onlyAdminsCanAddMembers || isAdmin || isCreator;
  const canRemoveMembers = !group?.groupSettings?.onlyAdminsCanRemoveMembers || isAdmin || isCreator;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, etc.)", { position: "top-center" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setAvatarFile(null);
    setAvatarPreview(group?.groupAvatar || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setIsUploading(true);
      let finalAvatarUrl = group?.groupAvatar || "";

      // Upload file if new one is selected
      if (avatarFile) {
        finalAvatarUrl = await uploadImage(avatarFile);
      }

      updateInfoMutation.mutate({
        conversationId,
        data: {
          groupName: groupName.trim(),
          description: description.trim(),
          groupAvatar: finalAvatarUrl || undefined,
        },
      });
    } catch (error) {
      console.error("Cloudinary save failed", error);
      toast.error("Failed to upload avatar image", { position: "top-center" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleSetting = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({
      conversationId,
      settings: {
        [key]: value,
      },
    });
  };

  const handleAddMember = (friendId: string) => {
    handleAddMemberMutation(friendId);
  };

  const handleAddMemberMutation = (friendId: string) => {
    addMemberMutation.mutate({ conversationId, memberId: friendId });
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate({ conversationId, memberId });
  };

  const handleMakeAdmin = (memberId: string) => {
    makeAdminMutation.mutate({ conversationId, memberId });
  };

  const handleRemoveAdmin = (memberId: string) => {
    removeAdminMutation.mutate({ conversationId, memberId });
  };

  const handleTransferOwnership = (memberId: string) => {
    if (window.confirm("Are you sure you want to transfer group ownership? You will lose owner permissions.")) {
      transferOwnershipMutation.mutate({ conversationId, memberId });
    }
  };

  const handleGenerateInvite = () => {
    generateInviteMutation.mutate(conversationId);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!", { position: "top-center" });
  };

  const inviteUrl = group?.inviteLink
    ? `${window.location.origin}/group/join/${group.inviteLink}`
    : "";

  const memberIds = group?.members?.map((m: any) => m._id) || [];
  const nonMembers = friendsList.filter((f: any) => !memberIds.includes(f._id));

  const filteredMembers = group?.members?.filter((m: any) =>
    m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[580px] sm:max-w-[580px] max-h-[85vh] flex flex-col bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 pb-3 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            <span>Group Settings & Members</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Manage your group properties, permissions, and member roster.
          </DialogDescription>
        </DialogHeader>

        {isGroupLoading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 py-12">Loading group details...</div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-900 mb-4 flex-shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setTab("info")}
                className={`flex-1 py-2 text-center text-xs font-semibold tracking-wider transition-all border-b-2 min-w-[90px] ${
                  tab === "info"
                    ? "border-amber-500 text-amber-400 bg-amber-500/5"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Group Info
              </button>
              <button
                type="button"
                onClick={() => setTab("members")}
                className={`flex-1 py-2 text-center text-xs font-semibold tracking-wider transition-all border-b-2 min-w-[90px] ${
                  tab === "members"
                    ? "border-amber-500 text-amber-400 bg-amber-500/5"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Members ({group?.members?.length || 0})
              </button>
              {(isCreator || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setTab("settings")}
                  className={`flex-1 py-2 text-center text-xs font-semibold tracking-wider transition-all border-b-2 min-w-[90px] ${
                    tab === "settings"
                      ? "border-amber-500 text-amber-400 bg-amber-500/5"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Permissions
                </button>
              )}
              {(isCreator || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setTab("invite")}
                  className={`flex-1 py-2 text-center text-xs font-semibold tracking-wider transition-all border-b-2 min-w-[90px] ${
                    tab === "invite"
                      ? "border-amber-500 text-amber-400 bg-amber-500/5"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Invite Link
                </button>
              )}
            </div>

            {/* TAB PANELS */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[300px] scrollbar-thin">
              
              {/* TAB 1: INFO */}
              {tab === "info" && (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-350 block mb-1">Group Name</label>
                    <Input
                      disabled={!canEditInfo}
                      placeholder="Group name..."
                      required
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700 disabled:opacity-50"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-zinc-350 block mb-1">Description</label>
                    <Input
                      disabled={!canEditInfo}
                      placeholder="Group description..."
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700 disabled:opacity-50"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Avatar Upload Area */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-350 block mb-2">Group Avatar (File Upload)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      disabled={!canEditInfo}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {avatarPreview ? (
                      <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-850">
                        <Avatar className="h-16 w-16 border border-zinc-700">
                          <AvatarImage src={avatarPreview} />
                          <AvatarFallback className="bg-zinc-800">
                            <ImageIcon className="h-6 w-6 text-zinc-400" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {avatarFile ? avatarFile.name : "Active avatar link"}
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {avatarFile ? `${(avatarFile.size / 1024).toFixed(1)} KB` : "Cloud URL saved"}
                          </p>
                          {canEditInfo && (
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 mt-1.5 cursor-pointer"
                            >
                              <X className="h-3 w-3" /> Reset/Change Image
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => canEditInfo && fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-xl p-4 transition-all ${
                          canEditInfo ? "cursor-pointer" : "opacity-50"
                        }`}
                      >
                        <UploadCloud className="h-8 w-8 text-zinc-500" />
                        <p className="text-xs text-zinc-400 mt-2 font-medium">Click to select image file</p>
                      </div>
                    )}
                  </div>

                  {canEditInfo && (
                    <Button
                      type="submit"
                      disabled={updateInfoMutation.isPending || isUploading}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs w-full mt-4 h-10"
                    >
                      {isUploading
                        ? "Uploading Avatar..."
                        : updateInfoMutation.isPending
                        ? "Saving..."
                        : "Save Group Info"}
                    </Button>
                  )}
                  {!canEditInfo && (
                    <div className="text-xs text-zinc-500 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/40 text-center">
                      Only admins can update group information.
                    </div>
                  )}
                </form>
              )}

              {/* TAB 2: MEMBERS */}
              {tab === "members" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative mb-2">
                      <Input
                        placeholder="Filter members..."
                        className="pl-3 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-8 focus-visible:ring-zinc-700 text-xs"
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                      {filteredMembers.map((member: any) => {
                        const isMemberOwner = member._id === creatorId;
                        const isMemberAdmin = group?.admins?.some((a: any) => (a._id || a) === member._id);
                        const isMe = member._id === currentUser?._id;

                        return (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 p-2 bg-zinc-900/40 border border-zinc-800/40 rounded-lg"
                          >
                            <Avatar className="h-7 w-7 border border-zinc-700">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="bg-zinc-850 text-zinc-300 text-xs">
                                {member.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-zinc-200 truncate">
                                {member.name} {isMe && "(You)"}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isMemberOwner ? (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                                  <Crown className="h-2.5 w-2.5 text-amber-400" /> Owner
                                </span>
                              ) : isMemberAdmin ? (
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                                  Admin
                                </span>
                              ) : (
                                <span className="bg-zinc-800 text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-full">
                                  Member
                                </span>
                              )}

                              {!isMemberOwner && !isMe && (isCreator || isAdmin) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon-sm" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white">
                                      <MoreVertical className="h-4.5 w-4.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-850 text-white">
                                    {isCreator && (
                                      <>
                                        {isMemberAdmin ? (
                                          <DropdownMenuItem onClick={() => handleRemoveAdmin(member._id)} className="text-xs">
                                            <ShieldAlert className="mr-2 h-3.5 w-3.5" /> Dismiss Admin
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem onClick={() => handleMakeAdmin(member._id)} className="text-xs">
                                            <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Make Admin
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleTransferOwnership(member._id)} className="text-xs text-amber-400">
                                          <Crown className="mr-2 h-3.5 w-3.5 text-amber-400" /> Transfer Ownership
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {canRemoveMembers && (
                                      <DropdownMenuItem onClick={() => handleRemoveMember(member._id)} className="text-xs text-red-500">
                                        <UserMinus className="mr-2 h-3.5 w-3.5 text-red-500" /> Remove from Group
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {canAddMembers && (
                    <div className="border-t border-zinc-900 pt-3 space-y-2">
                      <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5 text-emerald-400" /> Add New Members
                      </h4>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                        {nonMembers.length === 0 ? (
                          <div className="text-center text-zinc-500 text-xs py-2">All friends are members</div>
                        ) : (
                          nonMembers.map((friend: any) => (
                            <div
                              key={friend._id}
                              className="flex items-center gap-3 p-1.5 bg-zinc-900/10 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-all"
                            >
                              <Avatar className="h-6.5 w-6.5 border border-zinc-700">
                                <AvatarImage src={friend.avatar} alt={friend.name} />
                                <AvatarFallback className="bg-zinc-850 text-zinc-300 text-[10px]">
                                  {friend.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs text-zinc-200 truncate">{friend.name}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddMember(friend._id)}
                                disabled={addMemberMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-[10px] px-2 cursor-pointer"
                              >
                                Add
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SETTINGS / PERMISSIONS (ADMINS ONLY) */}
              {tab === "settings" && (isCreator || isAdmin) && (
                <div className="space-y-4 pt-1">
                  <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/40 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      Group Rule Settings
                    </h4>

                    <div className="flex items-center justify-between p-2 hover:bg-zinc-900/50 rounded transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-zinc-200">Only Admins Can Edit Info</p>
                        <p className="text-[10px] text-zinc-400">Restricts changing group title, avatar, description.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={group?.groupSettings?.onlyAdminsCanEditInfo || false}
                        onChange={(e) => handleToggleSetting("onlyAdminsCanEditInfo", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-750 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-zinc-900/50 rounded transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-zinc-200">Only Admins Can Add Members</p>
                        <p className="text-[10px] text-zinc-400">Regular members won't be able to add new people.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={group?.groupSettings?.onlyAdminsCanAddMembers || false}
                        onChange={(e) => handleToggleSetting("onlyAdminsCanAddMembers", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-750 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-zinc-900/50 rounded transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-zinc-200">Only Admins Can Remove Members</p>
                        <p className="text-[10px] text-zinc-400">Regular members cannot kick others out.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={group?.groupSettings?.onlyAdminsCanRemoveMembers || false}
                        onChange={(e) => handleToggleSetting("onlyAdminsCanRemoveMembers", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-750 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-zinc-900/50 rounded transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-zinc-200">Only Admins Can Send Messages</p>
                        <p className="text-[10px] text-zinc-400">Make this group an announcement-only channel.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={group?.groupSettings?.onlyAdminsCanSendMessages || false}
                        onChange={(e) => handleToggleSetting("onlyAdminsCanSendMessages", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-750 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: INVITE LINK & QR CODE (ADMINS ONLY) */}
              {tab === "invite" && (isCreator || isAdmin) && (
                <div className="space-y-4 pt-1">
                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850 flex flex-col items-center">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 self-start">
                      <Link2 className="h-4 w-4" /> Share & Invite Members
                    </h4>

                    {inviteUrl ? (
                      <div className="w-full flex flex-col items-center space-y-4">
                        {/* QR Code Container */}
                        <div className="p-3 bg-white rounded-xl shadow-md flex items-center justify-center">
                          <QRCode
                            value={inviteUrl}
                            size={160}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center font-medium">
                          Scan the QR Code to join this group chat
                        </p>

                        {/* Normal Text URL Copy Area */}
                        <div className="w-full flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 mt-2">
                          <Input
                            readOnly
                            value={inviteUrl}
                            className="bg-transparent border-0 h-6 text-xs text-zinc-300 pointer-events-none select-all truncate flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <Button
                            size="icon-sm"
                            type="button"
                            onClick={() => handleCopyLink(inviteUrl)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 h-8 w-8 rounded-md flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {isCreator && (
                          <Button
                            type="button"
                            onClick={handleGenerateInvite}
                            disabled={generateInviteMutation.isPending}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs w-full h-9 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${generateInviteMutation.isPending ? "animate-spin" : ""}`} />
                            Regenerate Invite Link
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full text-center py-6 space-y-3">
                        <p className="text-xs text-zinc-400">No active invite link generated for this group.</p>
                        {isCreator ? (
                          <Button
                            type="button"
                            onClick={handleGenerateInvite}
                            disabled={generateInviteMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 h-9 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <Link2 className="h-4 w-4" />
                            {generateInviteMutation.isPending ? "Generating..." : "Generate Invite Link"}
                          </Button>
                        ) : (
                          <p className="text-[10px] text-zinc-500">Only the group creator can generate invite links.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-zinc-800 flex-shrink-0">
          <Button onClick={() => setOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
