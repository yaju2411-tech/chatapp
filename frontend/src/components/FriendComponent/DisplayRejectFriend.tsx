import { VerifiedIcon, UserMinus, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { useState } from "react";
import {
    useAcceptFriendRequest,
    usePendingRequests,
    useRejectFriendRequest,
    useGetFriends,
    useRemoveFriends
} from "@/hooks/chatHook/useFriendHook";

export const DisplayFriend = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const acceptMutation = useAcceptFriendRequest();
    const rejectMutation = useRejectFriendRequest();
    const removeMutation = useRemoveFriends();
    
    const requests = usePendingRequests();
    const friends = useGetFriends(""); // get all friends

    const hasRequests = requests.data && requests.data.length > 0;
    const allFriends = friends.data?.friends || [];
    const pendingList = requests.data || [];

    const isSearching = searchQuery.trim() !== "";

    // Filter pending requests locally based on search query
    const filteredRequests = pendingList.filter((request: any) =>
        request.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.sender?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter friends locally based on search query
    const filteredFriends = allFriends.filter((friend: any) =>
        friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Determine what to display based on searching and pending state
    const showPending = isSearching ? filteredRequests.length > 0 : hasRequests;
    const showFriends = isSearching ? filteredFriends.length > 0 : !hasRequests;

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
                        <VerifiedIcon className="h-5 w-5" />
                        {hasRequests && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white animate-pulse">
                                {requests.data.length}
                            </span>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[500px] h-[600px] flex flex-col bg-zinc-950 border-zinc-850 text-white shadow-2xl p-6">
                    <DialogHeader className="border-b border-zinc-800 pb-3 mb-4 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span>Friend Requests & Connections</span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search Bar at the Top (Always Visible) */}
                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 focus-visible:ring-zinc-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Unified Scrollable Container */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
                        
                        {/* Pending Requests Section */}
                        {showPending && (
                            <div>
                                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Pending Requests ({isSearching ? filteredRequests.length : requests.data.length})
                                </h3>
                                <div className="space-y-2">
                                    {(isSearching ? filteredRequests : requests.data).map((request: any) => (
                                        <div key={request._id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-all">
                                            <Avatar className="h-10 w-10 border border-zinc-700">
                                                <AvatarImage src={request.sender.avatar} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-350">{request.sender.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-zinc-200 truncate">{request.sender.name}</p>
                                                <p className="text-xs text-zinc-400 truncate">{request.sender.email}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs font-semibold"
                                                    onClick={() => acceptMutation.mutate(request._id)}
                                                >
                                                    Accept
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="bg-red-950/40 hover:bg-red-900/60 border border-red-905 text-red-300 h-8 px-3 text-xs font-semibold"
                                                    onClick={() => rejectMutation.mutate(request._id)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends Section */}
                        {showFriends && (
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                                    Friends ({isSearching ? filteredFriends.length : allFriends.length})
                                </h3>
                                <div className="space-y-2">
                                    {(isSearching ? filteredFriends : allFriends).map((friend: any) => (
                                        <div key={friend._id} className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg hover:bg-zinc-900 hover:border-zinc-800 transition-all group">
                                            <Avatar className="h-10 w-10 border border-zinc-800">
                                                <AvatarImage src={friend.avatar} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-400">{friend.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-zinc-200 truncate">{friend.name}</p>
                                                <p className="text-xs text-zinc-500 truncate">{friend.email}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                                title="Remove Friend"
                                                onClick={() => removeMutation.mutate(friend._id)}
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty Search / Empty List State */}
                        {isSearching && filteredRequests.length === 0 && filteredFriends.length === 0 && (
                            <div className="text-center py-10 text-zinc-500">
                                <p className="text-sm">No connections or requests match "{searchQuery}"</p>
                            </div>
                        )}

                        {!isSearching && !hasRequests && allFriends.length === 0 && (
                            <div className="text-center py-10 text-zinc-500">
                                <p className="text-sm">No connections or requests yet.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}