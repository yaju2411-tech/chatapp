import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";

export const GlobalPage = () => {
    const navigate = useNavigate();
    return(<>
        <div className="flex flex-col h-screen w-full bg-black/90 text-white font-semibold">
            <div className="flex flex-col justify-center items-center min-h-[500px] mt-20 bg-black/80">
                <h1 className="text-2xl">Hello User</h1>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum dolore debitis numquam, iure delectus commodi assumenda iusto esse vel voluptates animi ipsum, nesciunt accusantium. Explicabo voluptates consequatur facilis nobis tenetur?</p>
                <div className="flex gap-5">
                    <Button className="bg-green-600" onClick={()=>navigate("/login")}>Login</Button>
                    <Button className="bg-zinc-500" onClick={()=>navigate("/signup")}>Create Account</Button>
                </div>
            </div>
        </div>
    </>);
}