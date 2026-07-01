import { useProfile } from "@/hooks/authHook/useProfileHook";
import { useDeleteMessage } from "@/hooks/chatHook/useMessage";
import MessageDropdown from "./MessageDropdown";
import { Download, FileText } from "lucide-react";

interface Props{
    selectionMode:boolean;
    selectedMessages:string[];
    setSelectionMode:(v:boolean)=>void;
    toggleMessage:(id:string)=>void;
    message:any,
}

export default function MessageBubble({message,selectedMessages,selectionMode,setSelectionMode,toggleMessage}:Props){
    const {data} = useProfile();
    const senderId = typeof message.sender === "string" ? message.sender : message.sender?._id;
    const isMe = senderId === data?.user?._id;
    const isSeen = isMe && message.seenBy?.some(
        (user:any) => user._id !== data?.user?._id
    );
    const deleteMutation = useDeleteMessage();
    const handleDelete = () => {
        deleteMutation.mutate(message._id);
    };
    
    return(<>
        <div className={`group flex mb-1 gap-2 relative ${isMe ? "justify-end" : "justify-start"}`}>
            <MessageDropdown isMe={isMe} onDelete={handleDelete}/>
                <div className={`max-w-sm py-2 px-2 gap-2 break-words rounded-sm shadow overflow-x-hidden 
                    ${isMe ? "bg-green-800 text-white rounded-br-2xl" : "bg-zinc-800 text-white rounded-bl-2xl"}`} 
                    onContextMenu={(e)=>{e.preventDefault();
                    if(!selectionMode){
                        setSelectionMode(true);
                        toggleMessage(message._id);
                    }}}
                    onClick={()=>{
                        if(selectionMode){
                            toggleMessage(message._id);
                        }
                    }}>
                    {message.isDeleted ? (<p className="italic text-gray-400">This message was deleted</p>) : (
                        <>
                            {message.messageType === "text" && (<p>{message.text}</p>)}
                            {message.messageType === "gif" && (
                                <img src={message.gifUrl} alt="gif" className="max-w-[220px] rounded-xl"/>
                            )}
                            {message.messageType === "image" && (
                                <div className="relative group w-fit">
                                    <img src={message.image} className="rounded-xl max-w-[240px]"/>
                                    <a href={message.image} download target="_blank"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/60 rounded-full p-2">
                                        <Download size={18}/>
                                    </a>
                                </div>
                            )}
                            {message.messageType === "video" && (
                                <video controls className="max-w-[220px] rounded-xl">
                                    <source src={message.video} />
                                </video>
                            )}
                            {message.messageType === "audio" && (
                                <audio controls>
                                    <source src={message.audio} />
                                </audio>
                            )}
                            {message.messageType === "file" && (
                                <a href={message.file} download target="_blank" itemType="pdf" className={`flex items-center justify-between rounded-sm px-2 py-2 w-70 ${isMe ? `bg-green-600` :`bg-zinc-700`}`}>
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-white" size={34}/>
                                        <div>
                                            <p className="font-medium">PDF Document</p>
                                            <p className="text-xs text-zinc-300">Tap to open</p>
                                        </div>
                                    </div>
                                    <Download className="text-white"/>
                                </a>  
                            )}
                        </>
                    )}
                    <div className="flex text-[10px] justify-end mt-1 opacity-80 gap-2 items-center">
                        {new Date(message.createdAt).toLocaleTimeString([],{
                            hour:"2-digit",
                            minute:"2-digit"
                        })}
                        {isMe && (<span className="ml-1 text-blue-400 text-sm font-semibold">{isSeen ? "✓✓" : "✓"}</span>)}
                        {selectionMode && (
                            <input type="checkbox" readOnly checked={selectedMessages.includes(message._id)}/>
                        )}
                    </div>
            </div>
        </div>
    </>);
}