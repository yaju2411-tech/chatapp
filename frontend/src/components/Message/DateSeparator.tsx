interface Props {
    date: string | Date;
}

import { formatConversationTime } from "@/utils/formatConversation";

export default function DateSeparator({ date }: Props) {
    return (<>
        <div className="flex items-center my-4">
            <div className="flex-1 border-t border-zinc-500"></div>
            <div className="mx-4 bg-zinc-800 text-white text-xs px-4 py-1.5 rounded-lg shrink-0 select-none shadow-sm">
                {formatConversationTime(date)}
            </div>
            <div className="flex-1 border-t border-zinc-500"></div>
        </div>
    </>);
}