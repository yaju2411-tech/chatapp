import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchUser } from "@/hooks/authHook/useProfileHook";
import { Plus, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSendFriendRequest } from "@/hooks/chatHook/useFriendHook";
import { toast } from "sonner";

export const AddFriendDialog = () => {
    const [search, setSearch] = useState("");
    const [foundUser, setFoundUser] = useState<any>(null);
    const [searched, setSearched] = useState(false);
    const searchMutation = useSearchUser();
    const sendFriendMutation = useSendFriendRequest();

    const performSearch = (query: string) => {
        if (!query.trim()) {
            setFoundUser(null);
            setSearched(false);
            return;
        }
        searchMutation.mutate(query, {
            onSuccess: (data) => {
                setFoundUser(data.user);
                setSearched(true);
            },
            onError: () => {
                setFoundUser(null);
                setSearched(true);
            }
        });
    };

    const handleSendRequest = () => {
        if (!foundUser?._id) return;
        sendFriendMutation.mutate(foundUser._id, {
            onSuccess: () => {
                toast.success("Friend request sent!", { position: "top-center" });
                setSearch("");
                setFoundUser(null);
                setSearched(false);
            }
        });
    };

    return (<>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[500px] h-[600px] flex flex-col bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6">
                <DialogHeader className="border-b border-zinc-800 pb-3 mb-4 flex-shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <span>Add Connection</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Search Bar at the Top */}
                <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Enter email address..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700"
                        value={search}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearch(val);
                            performSearch(val);
                        }} />
                    {search && (
                        <button
                            onClick={() => { setSearch(""); setFoundUser(null); setSearched(false); }}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col scrollbar-thin">
                    {foundUser ? (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                Search Results
                            </h3>
                            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-750 transition-all">
                                <Avatar className="h-10 w-10 border border-zinc-700">
                                    <AvatarImage src={foundUser?.avatar} alt={foundUser?.name} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-350">{foundUser?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-zinc-200 truncate">{foundUser?.name}</p>
                                    <p className="text-xs text-zinc-400 truncate">{foundUser?.email}</p>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
                                    onClick={handleSendRequest}
                                    disabled={sendFriendMutation.isPending}
                                >
                                    {sendFriendMutation.isPending ? "Sending..." : <Plus className="h-4 w-4" />}
                                    <span>Add Friend</span>
                                </Button>
                            </div>
                        </div>
                    ) : searched ? (
                        <div className="text-center my-auto py-10 text-zinc-500">
                            <p className="text-sm">No user found with email "{search}"</p>
                        </div>
                    ) : (
                        <div className="text-center my-auto py-10 px-6 flex flex-col items-center justify-center">
                            <img
                                src="/searchIcon.jpg"
                                alt="Search Friends"
                                className="w-28 h-28 object-contain invert-[0.93] contrast-125 brightness-90 mb-6" />
                            <h3 className="text-lg font-bold text-zinc-250">Search Friends</h3>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    </>
    );
}