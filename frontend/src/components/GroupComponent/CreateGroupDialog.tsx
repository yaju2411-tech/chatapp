import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetFriends } from "@/hooks/chatHook/useFriendHook";
import { useCreateGroup } from "@/hooks/groupHook/useGroup";
import { uploadImage } from "@/service/cloudinary";
import { Search, Users, Check, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  trigger: React.ReactNode;
}

export const CreateGroupDialog = ({ trigger }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [searchFriend, setSearchFriend] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: friendsData } = useGetFriends("");
  const friendsList = friendsData?.friends || [];
  const createGroupMutation = useCreateGroup();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredFriends = friendsList.filter((friend: any) =>
    friend.name?.toLowerCase().includes(searchFriend.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchFriend.toLowerCase())
  );

  const handleToggleMember = (friendId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

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
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (selectedMembers.length < 1) {
      toast.error("Please select at least one group member", { position: "top-center" });
      return;
    }
    try {
      setIsUploading(true);
      let uploadedAvatarUrl = "";
      if (avatarFile) {
        uploadedAvatarUrl = await uploadImage(avatarFile);
      }
      createGroupMutation.mutate(
        {
          groupName,
          description,
          groupAvatar: uploadedAvatarUrl || undefined,
          members: selectedMembers,
        },
        {
          onSuccess: () => {
            setOpen(false);
            setGroupName("");
            setDescription("");
            setAvatarFile(null);
            setAvatarPreview("");
            setSelectedMembers([]);
          },
        }
      );
    } catch (error) {
      console.error("Cloudinary upload failed", error);
      toast.error("Failed to upload group avatar. Try again.", { position: "top-center" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[850px] max-w-[95vw] sm:max-w-[850px] h-[600px] flex flex-col bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 pb-3 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span>Create New Group</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Configure group details and select connection members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden pt-4">
          {/* Main Desktop Grid */}
          <div className="flex-1 grid grid-cols-2 gap-6 min-h-0 overflow-hidden">
            {/* Left Column: Group Details & Avatar File Upload */}
            <div className="space-y-4 px-2 flex flex-col justify-start">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Group Details</h3>
              <div>
                <label className="text-xs font-semibold text-zinc-350 block mb-1">Group Name *</label>
                <Input
                  placeholder="Enter group name..."
                  required
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-350 block mb-1">Description</label>
                <Input
                  placeholder="What is this group about?"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Avatar File Uploader Area */}
              <div className="flex flex-col flex-1 min-h-[160px] justify-center">
                <label className="text-xs font-semibold text-zinc-350 block mb-2">Group Avatar (File Upload)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {avatarPreview ? (
                  <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-850">
                    <Avatar className="h-16 w-16 border-2 border-zinc-750 shadow-md">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="bg-zinc-800">
                        <ImageIcon className="h-6 w-6 text-zinc-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{avatarFile?.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {avatarFile ? `${(avatarFile.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 mt-1.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" /> Remove File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-xl cursor-pointer p-4 transition-all"
                  >
                    <UploadCloud className="h-8 w-8 text-zinc-500 group-hover:text-zinc-400 animate-bounce" />
                    <p className="text-xs text-zinc-400 mt-2 font-medium">Click to select image file</p>
                    <p className="text-[9px] text-zinc-650 mt-1">Supports PNG, JPG, JPEG, GIF</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Friends Search & checklist */}
            <div className="border-l border-zinc-900 pl-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Members</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {selectedMembers.length} selected
                </span>
              </div>

              <div className="relative mb-3 mr-1 flex-shrink-0">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search connections..."
                  className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-9 focus-visible:ring-zinc-700 text-xs"
                  value={searchFriend}
                  onChange={(e) => setSearchFriend(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                {filteredFriends.length === 0 ? (
                  <div className="text-center text-zinc-500 text-xs py-8">No friends found</div>
                ) : (
                  filteredFriends.map((friend: any) => {
                    const isSelected = selectedMembers.includes(friend._id);
                    return (
                      <div
                        key={friend._id}
                        onClick={() => handleToggleMember(friend._id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${isSelected
                          ? "bg-emerald-950/20 border-emerald-800/40"
                          : "bg-zinc-900/40 border-zinc-850 border-transparent hover:bg-zinc-800/30"
                          }`}
                      >
                        <Avatar className="h-8.5 w-8.5 border border-zinc-700">
                          <AvatarImage src={friend.avatar} alt={friend.name} />
                          <AvatarFallback className="bg-zinc-850 text-zinc-300 text-xs">
                            {friend.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-zinc-200 truncate">{friend.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{friend.email}</p>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${isSelected
                            ? "bg-emerald-500 border-emerald-400 text-white"
                            : "border-zinc-700"
                            }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900 flex-shrink-0 mt-4">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:bg-zinc-900 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={groupName.trim() === "" || selectedMembers.length < 1 || createGroupMutation.isPending || isUploading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 h-10"
            >
              {isUploading ? "Uploading Avatar..." : createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
