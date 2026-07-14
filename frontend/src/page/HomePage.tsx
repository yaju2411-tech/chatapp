import FriendDropdown from "@/components/FriendComponent/FriendDropDown";
import { Home } from "@/components/HomeComponent/Home"
import MessageArea from "@/components/Message/MessageArea";
import MessageInput from "@/components/Message/MessageInput";
import { MessageSelected } from "@/components/Message/MessageSelected";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger, } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useProfile } from "@/hooks/authHook/useProfileHook";
import { useDeleteConversation, useSingleConversation } from "@/hooks/chatHook/useConversation";
import { useClearChat, useDeleteManyMessages, useMarkMessageSeen } from "@/hooks/chatHook/useMessage";
import { useGetFriends } from "@/hooks/chatHook/useFriendHook";
import { socket } from "@/socket/socket";
import { ArrowDown, ArrowLeft, ArrowUp, Command, Users } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useGroupWebRtc } from "@/hooks/callingHook/useGroupWebRtc";
import GroupCallDialog from "@/components/call/GroupCallDialog";
import { useWebRTC } from "@/hooks/callingHook/useWebRtc";
import CallDialog from "@/components/call/CallDialog";
import IncomingCallDialog from "@/components/call/IncomingCall";
import { RemoteAudio } from "@/components/call/RemoteAudio";
import { VideoCall } from "@/components/call/VideoCall";

export default function Page() {
  const { data } = useProfile();
  const user = data?.user;
  const [selectedchat, setSelectedchat] = useState<any>(null);
  const { data: conversationData } = useSingleConversation(selectedchat);
  const otherUser = conversationData?.conversation?.members?.find((m: any) => m._id !== user?._id);
  const markSeenMutation = useMarkMessageSeen();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBottomBtn, setShowBottomBtn] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const isOnline = onlineUsers.includes(otherUser?._id);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const deleteManyMutation = useDeleteManyMessages();
  const clearChatMutation = useClearChat();
  const deleteConversationMutation = useDeleteConversation();
  const [copyTrigger, setCopyTrigger] = useState(0);
  const [reply, setReply] = useState<any>(null);
  const { data: friendsData } = useGetFriends("");

  const { endCall, startCall, remoteStream, incomingCall, acceptCall,
    rejectCall, callAccepted, calling, callType, localStream, recovering,
    switchToVideo, transitioningToGroup, setTransitioningToGroup } = useWebRTC({
      socket, currentUser: user, otherUser,
    });

  const {
    localStream: groupLocalStream,
    remoteStreams: groupRemoteStreams,
    participants: groupParticipants,
    incommingCall: groupIncomingCall,
    startGroupCall,
    joinGroupCall,
    leaveGroupCall,
    rejectGroupCall,
    toggleLocalMic: groupToggleLocalMic,
    toggleLocalCamera: groupToggleLocalCamera,
  } = useGroupWebRtc(
    user,
    selectedchat,
    conversationData?.conversation?.members || []
  );

  useEffect(() => {
    return () => {
      leaveGroupCall();
    };
  }, [selectedchat]);

  // Transition 1-to-1 active call to Group Call when third user is invited/joins
  const handleInviteFromOneToOne = (friendId: string, acceptedType: "audio" | "video") => {
    endCall(true, acceptedType);
    startGroupCall(acceptedType);
    socket.emit("invite-to-group-call", {
      targetUserId: friendId,
      conversationId: selectedchat,
      caller: user,
      callType: acceptedType
    });
  };

  useEffect(() => {
    if (groupIncomingCall && calling) {
      const acceptedType = callType || "audio";
      endCall();
      joinGroupCall(acceptedType);
      rejectGroupCall();
    }
  }, [groupIncomingCall, calling, callType]);

  useEffect(() => {
    if (transitioningToGroup) {
      const { callType } = transitioningToGroup;
      joinGroupCall(callType);
      setTransitioningToGroup(null);
    }
  }, [transitioningToGroup]);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get("chatId");

  useEffect(() => {
    if (queryChatId) {
      setSelectedchat(queryChatId);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("chatId");
      setSearchParams(newParams, { replace: true });
    }
  }, [queryChatId, searchParams, setSearchParams]);

  useEffect(() => {
    if (user) {
      if (user?._id) {
        socket.emit("setup", user._id);
      }
    }
    if (selectedchat) {
      socket.emit("join-conversation", selectedchat);
      markSeenMutation.mutate(selectedchat, {
        onSuccess: () => {
          socket.emit("seen-message", {
            conversationId: selectedchat
          });
        }
      });
    }

    return () => {
      if (selectedchat) {
        socket.emit("leave-conversation", selectedchat);
      }
    };
  }, [user, selectedchat]);

  // Reset message selection when switching chats
  useEffect(() => {
    exitSelection();
  }, [selectedchat]);

  useEffect(() => {
    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.off("online-users");
    };
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    const nearTop = el.scrollTop < 200;
    setShowBottomBtn(!nearBottom);
    setShowTopBtn(!nearTop);
  };
  const toggleMessage = (id: string) => {
    setSelectedMessages(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      }
      return [...prev, id];
    });
  };
  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedMessages([]);
  };
  const handleDeleteSelected = () => {
    deleteManyMutation.mutate({
      conversationId: selectedchat,
      messageIds: selectedMessages,
    }, {
      onSuccess: () => {
        setSelectedMessages([]);
        setSelectionMode(false);
      },
    });
  };

  return (
    <>
      <TooltipProvider>
        <SidebarProvider
          style={{
            "--sidebar-width": "370px",
          } as React.CSSProperties}
        >
          <Home selectedchat={selectedchat} setSelectedchat={setSelectedchat} />
          <SidebarInset className="flex flex-col h-screen">
            <header className="sticky flex shrink-0 items-center gap-2 border-b p-4 bg-black h-16">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={
                    selectedchat
                      ? conversationData?.conversation?.isGroup
                        ? conversationData?.conversation?.groupAvatar
                        : otherUser?.avatar
                      : undefined
                  }
                />
                <AvatarFallback className="rounded-lg bg-zinc-800 text-zinc-300">
                  {conversationData?.conversation?.isGroup ? (
                    <Users className="size-4" />
                  ) : (
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Command className="size-5" />
                    </div>
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm text-white">
                <span className="truncate font-medium">
                  {selectedchat ? (
                    conversationData?.conversation?.isGroup ? (
                      conversationData?.conversation?.groupName
                    ) : (
                      otherUser?.name
                    )
                  ) : (
                    "Chat App"
                  )}
                </span>
                <span className="truncate text-xs text-zinc-400">
                  {selectedchat ? (
                    conversationData?.conversation?.isGroup ? (
                      `${conversationData?.conversation?.members?.length || 0} members`
                    ) : isOnline ? (
                      "Online"
                    ) : otherUser?.lastSeen ? (
                      `Last seen ${new Date(otherUser.lastSeen).toLocaleString()}`
                    ) : (
                      "Offline"
                    )
                  ) : (
                    ""
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">

                {selectionMode && <div className="flex text-white font-semibold">{selectedMessages.length} Selected</div>}
                {selectionMode ? <MessageSelected onCancel={exitSelection} onDelete={handleDeleteSelected} onCopy={() => setCopyTrigger(prev => prev + 1)} selectedMessages={selectedMessages} /> :
                  <FriendDropdown friend={otherUser} onDelete={() => {
                    deleteConversationMutation.mutate(selectedchat);
                  }}
                    onClearChat={() => {
                      clearChatMutation.mutate(selectedchat);
                    }} />
                }
                <SidebarTrigger className="-ml-1 text-white" />
                <Button variant="ghost" className="-ml-1 md:hidden text-white"
                  onClick={() => setSelectedchat(null)}>
                  <ArrowLeft />
                </Button>
              </div>
            </header>
            <div
              className={`flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black`}>
              {selectedchat ? (<>
                <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll} style={{
                  backgroundImage: "url('/whatsappBackgroundImage.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}>
                  <MessageArea conversationId={selectedchat} selectionMode={selectionMode} selectedMessages={selectedMessages}
                    setSelectionMode={setSelectionMode} toggleMessage={toggleMessage} copyTrigger={copyTrigger} setReply={setReply}
                    bottomRef={bottomRef} />
                  <div ref={bottomRef} />
                  {showTopBtn && (
                    <Button size="icon" className="fixed right-6 top-24 rounded-full z-50"
                      onClick={() => {
                        scrollRef.current?.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}>
                      <ArrowUp className="bg-white text-black" />
                    </Button>
                  )}
                  {showBottomBtn && (
                    <Button
                      size="icon" className="fixed right-6 bottom-24 rounded-full z-50"
                      onClick={() => {
                        bottomRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                    >
                      <ArrowDown className="bg-white text-black" />
                    </Button>
                  )}
                </div>
                <div className="sticky shrink-0 border-t p-4 bg-black">
                  <MessageInput reply={reply} clearReply={() => setReply(null)}
                    conversationId={selectedchat} currentUser={user} receiver={otherUser} onCall={conversationData?.conversation?.isGroup ? startGroupCall : startCall} />
                </div>
              </>) : (
                <div className="flex flex-1 flex-col items-center justify-center" style={{
                  backgroundImage: "url('/whatsappBackgroundImage.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}>
                  <h1 className="text-2xl font-semibold text-zinc-200">Welcome to Chat</h1>
                  <p className="text-zinc-500 mt-2">Select a conversation to start messaging</p>
                </div>)}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>

      {/* 1-to-1 Call Overlays */}
      <IncomingCallDialog
        open={!!incomingCall}
        caller={
          incomingCall?.caller
            ? {
              ...incomingCall.caller,
              name: friendsData?.friends?.some((f: any) => f._id === incomingCall.caller._id)
                ? incomingCall.caller.name
                : (incomingCall.caller.email || incomingCall.caller.name)
            }
            : undefined
        }
        callType={callType ?? "audio"}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {calling && callType === "audio" && (
        <>
          <CallDialog
            open={calling}
            accepted={callAccepted}
            user={incomingCall?.caller || otherUser}
            localStream={localStream}
            remoteStream={remoteStream}
            friends={friendsData?.friends || []}
            onEnd={endCall}
            onInvite={(friendId) => handleInviteFromOneToOne(friendId, "audio")}
            onSwitchToVideo={switchToVideo}
          />
          <RemoteAudio stream={remoteStream} />
        </>
      )}

      {calling && callType === "video" && (
        <VideoCall
          open={calling}
          accept={callAccepted}
          recover={recovering}
          user={incomingCall?.caller || otherUser}
          localStream={localStream}
          remoteStream={remoteStream}
          friends={friendsData?.friends || []}
          onEnd={endCall}
          onInvite={(friendId) => handleInviteFromOneToOne(friendId, "video")}
        />
      )}

      {/* Group Call Overlays (Unified calling UI) */}
      <IncomingCallDialog
        open={!!groupIncomingCall}
        isGroup={true}
        groupName={
          conversationData?.conversation?.isGroup
            ? (conversationData?.conversation?.groupName || "Group Call")
            : (
              friendsData?.friends?.some((f: any) => f._id === groupIncomingCall?.caller?._id)
                ? (groupIncomingCall?.caller?.name || "Incoming Call")
                : (groupIncomingCall?.caller?.email || groupIncomingCall?.caller?.name || "Incoming Call")
            )
        }
        groupAvatar={
          conversationData?.conversation?.isGroup
            ? conversationData?.conversation?.groupAvatar
            : groupIncomingCall?.caller?.avatar
        }
        caller={
          groupIncomingCall?.caller
            ? {
              ...groupIncomingCall.caller,
              name: friendsData?.friends?.some((f: any) => f._id === groupIncomingCall.caller._id)
                ? groupIncomingCall.caller.name
                : (groupIncomingCall.caller.email || groupIncomingCall.caller.name)
            }
            : undefined
        }
        callType={groupIncomingCall?.callType || "audio"}
        onAccept={(type) => {
          joinGroupCall(type);
          rejectGroupCall();
        }}
        onReject={rejectGroupCall}
      />

      <GroupCallDialog
        open={!!groupLocalStream}
        callType={groupIncomingCall?.callType || (groupLocalStream?.getVideoTracks().length ? "video" : "audio")}
        groupName={
          conversationData?.conversation?.isGroup
            ? (conversationData?.conversation?.groupName || "Group Call")
            : (otherUser?.name || groupIncomingCall?.caller?.name || "Call")
        }
        groupAvatar={
          conversationData?.conversation?.isGroup
            ? conversationData?.conversation?.groupAvatar
            : (otherUser?.avatar || groupIncomingCall?.caller?.avatar)
        }
        isGroup={!!conversationData?.conversation?.isGroup}
        localStream={groupLocalStream}
        remoteStreams={groupRemoteStreams}
        participants={groupParticipants}
        currentUser={user}
        friends={friendsData?.friends || []}
        onInviteUser={(friendId) => {
          socket.emit("invite-to-group-call", {
            targetUserId: friendId,
            conversationId: selectedchat || groupIncomingCall?.conversationId,
            caller: user,
            callType: groupIncomingCall?.callType || (groupLocalStream?.getVideoTracks().length ? "video" : "audio")
          });
        }}
        onLeave={leaveGroupCall}
        onToggleMic={groupToggleLocalMic}
        onToggleCamera={groupToggleLocalCamera}
      />
    </>)
}
