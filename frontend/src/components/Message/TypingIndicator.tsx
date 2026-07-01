export default function TypingIndicator() {
    return (
        <div className="flex gap-1">
            <div className="typing-dot w-2 h-2 rounded-full bg-white"></div>
            <div
                className="typing-dot w-2 h-2 rounded-full bg-white"
                style={{ animationDelay: "0.2s" }}
            ></div>
            <div
                className="typing-dot w-2 h-2 rounded-full bg-white"
                style={{ animationDelay: "0.4s" }}
            ></div>
        </div>
    );
}