import { useEffect, useRef,useState } from "react";
import { Button } from "../ui/button";

interface Props{
    open:boolean;
    onCapture : (file:File)=>void;
    onClose : ()=> void;
}

export const CameraDialog = ({open,onClose,onCapture}:Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    //to open ccamera
    useEffect(()=>{
        //to open and start camera
        if(!open) return;
        const startCamera = async() => {
            try{
                const stream = await navigator.mediaDevices.getUserMedia({
                    video:true,
                })
                streamRef.current = stream;
                if(videoRef.current){
                    videoRef.current.srcObject = stream;
                }
            }
            catch(err){
                console.log(err);
            }
        };
        startCamera();
    },[open]);
    useEffect(() => {
        return () => {
            if (previewUrl) {URL.revokeObjectURL(previewUrl);}
        };
    }, [previewUrl]);
    if(!open) return null;
    //stop camera
    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    };
    //to take photo
    const takePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            setCapturedBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
        }, "image/jpeg", 0.9);
    };
    //send photot if success
    const sendPhoto = () => {
        if (!capturedBlob) return;
        const file = new File([capturedBlob],`camera-${Date.now()}.jpg`,{type: "image/jpeg",});
        onCapture(file);
        URL.revokeObjectURL(previewUrl);
        setCapturedBlob(null);
        setPreviewUrl("");
        stopCamera();
        onClose();
    };
    //take retake
    const retakePhoto = () => {
        URL.revokeObjectURL(previewUrl);
        setCapturedBlob(null);
        setPreviewUrl("");
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play();
        }
    };
    return(<>
        <div className="absolute bottom-18 z-[100] bg-black/80 flex items-center justify-center">
            <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700 shadow-2xl w-[300px]">                
                <div className="relative w-full aspect-[3/4]">
                    <video ref={videoRef} autoPlay playsInline 
                    className={`absolute inset-0 w-full h-full object-cover ${previewUrl ? "hidden" : "block"}`}/>
                    {previewUrl && (
                        <img src={previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover"/>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden"/>
                <div className="flex gap-3 p-4 bg-zinc-900">
                    {previewUrl ? (<>
                            <Button variant="destructive" className="flex-1" onClick={retakePhoto}>❌ Retake</Button>
                            <Button className="flex-1" onClick={sendPhoto}>✅ Send</Button>
                        </>) : (<>
                            <Button variant="destructive" className="flex-1" onClick={()=>{onClose();stopCamera();}}>Close</Button>
                            <Button className="flex-1"onClick={takePhoto}>📸 Capture</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    </>);
}