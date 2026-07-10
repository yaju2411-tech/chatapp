export const formatConversationTime = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    // Today
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    // Message Day
    const messageDay = new Date(messageDate.getFullYear(),messageDate.getMonth(),messageDate.getDate());
    // Difference in days
    const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));
    // Today -> show time
    if (diffDays === 0) {
        return "Today"
    }
    // Yesterday
    if (diffDays === 1) {
        return "Yesterday";
    }
    // Last 7 days
    if (diffDays < 7) {
        return messageDate.toLocaleDateString([], {
            weekday: "short",
        });
    }
    // Older
    return messageDate.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};