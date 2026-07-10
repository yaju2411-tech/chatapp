import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles, } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar"
import { useProfile, useUpdateProfile } from "@/hooks/authHook/useProfileHook";
import { useEffect, useState } from "react";
import { useLogout } from "@/hooks/authHook/useLoginSignup";
import { uploadImage } from "@/service/cloudinary";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { socket } from "@/socket/socket";

export function NavUser() {
  const { data } = useProfile();
  const user = data?.user;
  const [name, setName] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const logout = useLogout();
  const updateProfileMutation = useUpdateProfile();
  const { isMobile } = useSidebar();

  useEffect(() => {
    if (user) {
      if (user?._id) {
        socket.emit("setup", user._id);
      }
      setName(user.name);
      setPreviewAvatar(user.avatar);
    }
  }, [user]);
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewAvatar(URL.createObjectURL(file));
  };
  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    let avatar = user?.avatar;
    if (avatarFile) {
      avatar = await uploadImage(avatarFile);
    }
    updateProfileMutation.mutate({ name, avatar });
    setAvatarFile(null);
    toast.success("Profile Updated Succesfully", { position: "top-center" });
  };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-10 w-10 rounded-xl p-0 hover:bg-zinc-900">
              <Avatar className="h-8 w-8 rounded-xl">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-xl bg-zinc-850 text-zinc-300">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="sr-only">
                <span>{user?.name}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <BadgeCheck />
                    Update Profile
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Profile</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={previewAvatar} />
                        <AvatarFallback>
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <label htmlFor="">Update Profile</label>
                    <Input type="file" accept="image/*" onChange={handleAvatarChange} className="mt-2" />
                    <label htmlFor="">Update Profile</label>
                    <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
                    <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
