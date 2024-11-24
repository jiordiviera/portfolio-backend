export const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readTimeMinutes = wordCount / wordsPerMinute;
    return Math.ceil(readTimeMinutes);
};
