let trendingCache = null;
let lastFetch = 0;

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

export const getTrendingCache = () => {
    if ( trendingCache && Date.now() - lastFetch < CACHE_TIME) {
        return trendingCache;
    }
    return null;
};

export const setTrendingCache = (data) => {
    trendingCache = data;
    lastFetch = Date.now();
};