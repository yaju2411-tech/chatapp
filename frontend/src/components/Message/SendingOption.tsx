import { CameraIcon, Music, Notebook, PhoneCall, Plus, Video, WindIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useRef, useState } from "react";
import { CameraDialog } from "../camera/CameraDialog";

interface Props {
    onFileSelect:(file:File)=>void;
    currentUser:any;
    receiver:any;
    onCall:(type:"audio"|"video")=>void;
}

export const SendingOption = ({onFileSelect,onCall}:Props) => {
    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [openCamera, setOpenCamera] = useState(false);
    const upload = (file?: File) => {
        if (!file) return;
        onFileSelect(file);
    };
    return(<>
        <div>
            <input hidden type="file" accept="image/*" ref={imageRef} onChange={(e)=>upload(e.target.files?.[0])}/>
            <input hidden type="file" accept="video/*" ref={videoRef} onChange={(e)=>upload(e.target.files?.[0])}/>
            <input hidden type="file" accept="audio/*" ref={audioRef} onChange={(e)=>upload(e.target.files?.[0])}/>
            <input hidden type="file" accept=".pdf" ref={fileRef} onChange={(e)=>upload(e.target.files?.[0])}/>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><Plus/></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="">
                    <DropdownMenuItem onClick={()=>{setOpenCamera(true);}}>
                        <CameraIcon/>Camera
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => imageRef.current?.click()}>
                        <WindIcon/>Gallery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => videoRef.current?.click()}>
                        <Video/>Video
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => audioRef.current?.click()}>
                        <Music/>Audio
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                        <Notebook/>PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant={"ghost"} size={"icon"} onClick={() => onCall("audio")}>
                <PhoneCall/>
            </Button>
        </div>
        <CameraDialog open={openCamera} onClose={() => setOpenCamera(false)} onCapture={(file) => {onFileSelect(file);}}/>
    </>);
}