import gifApi from "../../service/gif-service.js";
import {getTrendingCache,setTrendingCache,} from "../../service/gif-cache.js";

export const getTrendingGifs = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 20;
        // Only cache first page
        if (page === 1) {
            const cache = getTrendingCache();
            if (cache) {
                return res.status(200).json(cache);
            }
        }
        const { data } = await gifApi.get(`/api/v1/${process.env.KLIPY_API_KEY}/gifs/trending`,{
            params: {page,per_page,},
        });
        const gifs = data.data.data.map((gif) => ({
            id: gif.id,
            slug: gif.slug,
            title: gif.title,
            gifUrl: gif.file.hd.gif.url,
            previewUrl: gif.file.hd.webp.url,
            thumbnail: gif.file.hd.jpg.url,
            videoUrl: gif.file.hd.mp4.url,
            width: gif.file.hd.gif.width,
            height: gif.file.hd.gif.height,
        }));
        const response = {
            success: true,
            gifs,
            pagination: {
                current_page: data.data.current_page,
                per_page: data.data.per_page,
                has_next: data.data.has_next,
            },
        };
        if (page === 1) {setTrendingCache(response);}
        return res.status(200).json(response);
    } catch (error) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch trending GIFs",
        });
    }
};