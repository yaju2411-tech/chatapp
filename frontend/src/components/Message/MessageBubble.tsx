import { useProfile } from "@/hooks/authHook/useProfileHook";
import { useDeleteMessage } from "@/hooks/chatHook/useMessage";
import MessageDropdown from "./MessageDropdown";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { ForwardMessage } from "./ForwardMessage";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Props {
    selectionMode: boolean;
    selectedMessages: string[];
    setReply: (msg: any) => any;
    setSelectionMode: (v: boolean) => void;
    toggleMessage: (id: string) => void;
    message: any,
}

export default function MessageBubble({ message, selectedMessages, selectionMode, setSelectionMode, toggleMessage, setReply }: Props) {
    const { data } = useProfile();
    const senderId = typeof message.sender === "string" ? message.sender : message.sender?._id;
    const isMe = senderId === data?.user?._id;
    const isSeen = isMe && message.seenBy?.some(
        (user: any) => user._id !== data?.user?._id
    );
    const deleteMutation = useDeleteMessage();
    const handleDelete = () => {
        deleteMutation.mutate(message._id);
    };
    const handleCopy = async () => {
        if (message.messageType !== "text") return;
        navigator.clipboard.writeText(message.text);
    }
    const [openForward, setOpenForward] = useState(false);

    const isMedia = ["image", "video", "gif"].includes(message.messageType) && !message.isDeleted;
    const hasReply = !!message.replyTo;
    const bubblePadding = isMedia ? (hasReply ? "pt-2 px-2.5 pb-2" : "p-1") : "pt-2 px-3 pb-1";

    return (<>
        <div className={`group flex mb-2 gap-2 relative items-end ${isMe ? "justify-end" : "justify-start"}`}>
            {!isMe && (
                <Avatar className="h-8 w-8 rounded-full border border-zinc-800 flex-shrink-0 select-none">
                    <AvatarImage src={message.sender?.avatar} alt={message.sender?.name} />
                    <AvatarFallback className="rounded-full bg-zinc-850 text-zinc-300 text-[10px]">
                        {message.sender?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                </Avatar>
            )}
            {isMe && (
                <MessageDropdown onForward={() => setOpenForward(true)} isMe={isMe} onDelete={handleDelete} onCopy={handleCopy} onReply={() => setReply(message)} />
            )}
            <ForwardMessage open={openForward} onClose={() => setOpenForward(false)} messageIds={[message._id]} />
            <div className={`max-w-sm gap-2 break-words rounded-2xl shadow-md overflow-x-hidden relative ${bubblePadding} transition-all duration-200
                ${isMe ? "bg-[#005c4b] text-zinc-100 rounded-tr-none border border-emerald-800/10" : "bg-[#202c33] text-zinc-100 rounded-bl-none border border-zinc-700/10"}`}
                onContextMenu={(e) => {
                    e.preventDefault();
                    if (!selectionMode) {
                        setSelectionMode(true);
                        toggleMessage(message._id);
                    }
                }}
                onClick={() => {
                    if (selectionMode) {
                        toggleMessage(message._id);
                    }
                }}>
                {message.isDeleted ? (<p className="italic text-zinc-400/80">This message was deleted</p>) : (
                    <>
                        {/*reply message ui*/}
                        {message.replyTo && (
                            <div className="mb-2 border-l-4 border-emerald-400 bg-black/30 rounded-r p-2 text-xs flex flex-col gap-0.5 select-none cursor-pointer hover:bg-black/40 transition-all">
                                <p className="font-semibold text-emerald-400/90 truncate">
                                    {message.replyTo.sender?.name}
                                </p>
                                <p className="text-zinc-300 truncate">
                                    {message.replyTo.messageType === "text" && message.replyTo.text}
                                    {message.replyTo.messageType === "image" && "📷 Photo"}
                                    {message.replyTo.messageType === "video" && "🎥 Video"}
                                    {message.replyTo.messageType === "audio" && "🎵 Audio"}
                                    {message.replyTo.messageType === "gif" && "😂 GIF"}
                                    {message.replyTo.messageType === "file" && "📄 Document"}
                                </p>
                            </div>
                        )}
                        {/*original message ui*/}
                        {message.messageType === "text" && (
                            <div className="pb-4 pr-12">
                                <p className="text-sm font-[350] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                            </div>
                        )}
                        {message.messageType === "gif" && (
                            <div className="relative group w-fit">
                                <img src={message.gifUrl} alt="gif" className="max-w-[220px] rounded-xl block" />
                                <div className="absolute bottom-2 right-2 bg-black/55 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs select-none">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {isMe && <span className={`ml-0.5 text-[12px] leading-none font-semibold ${isSeen ? "text-[#53bdeb]" : "text-zinc-400/80"}`}>{isSeen ? "✓✓" : "✓"}</span>}
                                    {selectionMode && <input type="checkbox" readOnly checked={selectedMessages.includes(message._id)} className="ml-1" />}
                                </div>
                            </div>
                        )}
                        {message.messageType === "image" && (
                            <div className="relative group w-fit">
                                <img src={message.image} className="rounded-xl max-w-[240px] block" />
                                <a href={message.image} download target="_blank"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/60 rounded-full p-2 text-white hover:bg-black/80">
                                    <Download size={18} />
                                </a>
                                <div className="absolute bottom-2 right-2 bg-black/55 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs select-none">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {isMe && <span className={`ml-0.5 text-[12px] leading-none font-semibold ${isSeen ? "text-[#53bdeb]" : "text-zinc-400/80"}`}>{isSeen ? "✓✓" : "✓"}</span>}
                                    {selectionMode && <input type="checkbox" readOnly checked={selectedMessages.includes(message._id)} className="ml-1" />}
                                </div>
                            </div>
                        )}
                        {message.messageType === "video" && (
                            <div className="relative group w-fit">
                                <video controls className="max-w-[220px] rounded-xl block"><source src={message.video} /></video>
                                <div className="absolute bottom-12 right-2 bg-black/55 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs select-none">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {isMe && <span className={`ml-0.5 text-[12px] leading-none font-semibold ${isSeen ? "text-[#53bdeb]" : "text-zinc-400/80"}`}>{isSeen ? "✓✓" : "✓"}</span>}
                                    {selectionMode && <input type="checkbox" readOnly checked={selectedMessages.includes(message._id)} className="ml-1" />}
                                </div>
                            </div>
                        )}
                        {message.messageType === "audio" && (
                            <div className="pb-5">
                                <audio controls className="max-w-[240px]"><source src={message.audio} /></audio>
                            </div>
                        )}
                        {message.messageType === "file" && (
                            <div className="pb-5">
                                <a href={message.file} download target="_blank" itemType="pdf" className={`flex items-center justify-between rounded-xl px-3 py-2.5 w-70 ${isMe ? `bg-[#025140] hover:bg-[#024a3a]` : `bg-[#2a3942] hover:bg-[#32444f]`} transition-colors`}>
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-zinc-100" size={32} />
                                        <div>
                                            <p className="font-semibold text-xs text-zinc-100">PDF Document</p>
                                            <p className="text-[10px] text-zinc-300/80">Tap to open & download</p>
                                        </div>
                                    </div>
                                    <Download className="text-zinc-100 h-4 w-4" />
                                </a>
                            </div>
                        )}
                    </>
                )}
                {!isMedia && (
                    <div className="absolute bottom-1 right-2 flex text-[9px] text-zinc-300/85 gap-1 items-center select-none">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                        {isMe && <span className={`ml-0.5 text-[12px] leading-none font-semibold ${isSeen ? "text-[#53bdeb]" : "text-zinc-300/60"}`}>{isSeen ? "✓✓" : "✓"}</span>}
                        {selectionMode && (
                            <input type="checkbox" readOnly checked={selectedMessages.includes(message._id)} className="ml-1" />
                        )}
                    </div>
                )}
            </div>
            {!isMe && (
                <MessageDropdown onForward={() => setOpenForward(true)} isMe={isMe} onDelete={handleDelete} onCopy={handleCopy} onReply={() => setReply(message)} />
            )}
        </div>
    </>);
}