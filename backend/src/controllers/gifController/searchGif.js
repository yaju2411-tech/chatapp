import gifApi from "../../service/gif-service.js";

export const searchGifs = async (req, res) => {
    try {
        const q = req.query.q;
        const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 20;

        const { data } = await gifApi.get(
            `/api/v1/${process.env.KLIPY_API_KEY}/gifs/search`,{
                params: { q:q.trim().toLowerCase(), page, per_page },
            }
        );

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

        return res.status(200).json({
            success: true,
            gifs,
            pagination: {
                currentPage: data.data.current_page,
                perPage: data.data.per_page,
                hasNext: data.data.has_next,
                meta: data.data.meta,
            },
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to search GIFs",
        });
    }
};