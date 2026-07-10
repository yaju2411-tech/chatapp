import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { FileImage, SendHorizontal, Smile, X } from "lucide-react";
import { useSendMessage } from "@/hooks/chatHook/useMessage";
import { socket } from "@/socket/socket";
import EmojiPicker from "emoji-picker-react";
import { useSearchGifs, useTrendingGifs } from "../../hooks/gifHooks";
import { useDebounce } from "use-debounce"; 
import { SendingOption } from "./SendingOption";
import { useUploadMedia } from "@/hooks/chatHook/useMessage";
import { Theme } from "emoji-picker-react";


interface Props{
    conversationId:string;
    currentUser:any;
    receiver:any;
    onCall:(type:"audio"|"video")=>void;
    reply:any;clearReply:any;
}

export default function MessageInput({conversationId,currentUser,receiver,onCall,reply,clearReply}:Props){
    const [text,setText]=useState("");
    const sendMessageMutation = useSendMessage();
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [picker, setPicker] = useState<"emoji" | "gif" | null>(null);
    const [search,setSearch] = useState("");
    const [debounceSearch] = useDebounce(search,400);
    const {data: trendingData} = useTrendingGifs();
    const {data: searchData} = useSearchGifs(debounceSearch);
    const gifs = search.trim() ? searchData?.gifs || [] : trendingData?.gifs || [];
    const uploadMutation = useUploadMedia();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTyping = (e:any) => {
        setText(e.target.value);
        socket.emit("typing", conversationId);
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = setTimeout(() => {
            socket.emit("stop-typing", conversationId);
        }, 1000);
    };
    const handleSend = () => {
        if (!text.trim()) return;
        socket.emit("stop-typing", conversationId);
        sendMessageMutation.mutate({
            conversationId,text,replyTo: reply?._id,
        },{
            onSuccess: () => {
                clearReply();
                setText("");
                setPicker(null);
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                }
            }
        });
    };
   const handleFileUpload = (file: File) => {
        uploadMutation.mutate({conversationId,file,replyTo: reply?._id},{
            onSuccess: () => {
                clearReply();
            },
        });
    };
    return(<>
        {reply && (
            <div className="flex justify-between items-center rounded-md bg-zinc-800 p-2 mb-2">
                <div>
                    <p className="text-xs text-green-400"> Replying to { reply.sender?.name ?? "User" } </p>
                    <p className="text-sm text-white truncate">
                        {reply.messageType==="text" && reply.text}
                        {reply.messageType==="image" && "📷 Photo"}
                        {reply.messageType==="video" && "🎥 Video"}
                        {reply.messageType==="audio" && "🎵 Audio"}
                        {reply.messageType==="gif" && "😂 GIF"}
                        {reply.messageType==="file" && "📄 Document"}
                    </p>
                </div>
                <Button size="icon" variant="ghost" onClick={clearReply}><X/></Button>
            </div>
        )}
        <div className="relative flex items-center rounded-2xl bg-zinc-900/95 border border-zinc-700 px-3 py-2 shadow-lg backdrop-blur-md text-white">
            <SendingOption onFileSelect={handleFileUpload} receiver={receiver} currentUser={currentUser} onCall={onCall}/>
            <Button variant="ghost" size="icon"
                onClick={() =>setPicker(prev => prev === "emoji" ? null : "emoji")}>
                <Smile />
            </Button>
            <Button variant="ghost" size="icon"
                onClick={() => setPicker(prev => prev === "gif" ? null : "gif")}>
                <FileImage />
            </Button>
            <textarea ref={textareaRef} rows={1} value={text} placeholder="Type message..."
                onChange={handleTyping} onInput={(e)=>{
                    e.currentTarget.style.height="auto";
                    e.currentTarget.style.height=e.currentTarget.scrollHeight+"px";}}
                className="flex-1 resize-none bg-transparent outline-none text-white placeholder:text-zinc-400 min-h-[24px] max-h-40 overflow-y-auto py-1 text-sm leading-normal"/>
            {picker === "emoji" && (
                <div className="absolute bottom-16 left-0 z-50">
                    <EmojiPicker theme={Theme.DARK} onEmojiClick={(emoji)=> setText(prev=>prev+emoji.emoji)}/>
                </div>
            )}
            {picker === "gif" && (
                <div className="absolute bottom-16 left-12 z-50 w-[420px] rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden">
                    <div className="sticky top-0 bg-zinc-900 pb-2 z-20">
                        <input placeholder="Search GIF..." value={search} onChange={(e)=>setSearch(e.target.value)}
                        className=" w-full rounded-lg bg-zinc-800 px-3 py-2 text-white outline-none"/>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 h-[380px] overflow-y-auto">
                        {gifs.map((gif: any) => (
                            <img key={gif.id} src={gif.previewUrl} alt={gif.title}
                                className="rounded-lg cursor-pointer hover:scale-105 transition"
                                onClick={() => {
                                    sendMessageMutation.mutate({
                                        conversationId,gifUrl: gif.gifUrl,messageType: "gif",replyTo: reply?._id,
                                    },{
                                        onSuccess: () => {
                                            clearReply();setPicker(null);setSearch("");
                                        },});
                                setPicker(null); setSearch("");
                            }}/>
                        ))}
                    </div>
                </div>
            )}
            <Button onClick={handleSend}>
                <SendHorizontal/>
            </Button>
        </div>
    </>);
}