interface Props {
    date: string | Date;
}

import { formatConversationTime } from "@/utils/formatConversation";

export default function DateSeparator({ date }: Props) {
    return (<>
        <div className="flex justify-center my-3">
            <div className="bg-zinc-800 text-white text-xs px-4 py-2 rounded-lg">
                {formatConversationTime(date)}
            </div>
        </div>
    </>);
}