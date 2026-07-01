import { api } from "../service/api";

export const getTrendingGifs = async (page = 1,per_page = 50) => {
    const { data } = await api.get("/gif/trending", {
        params: {
            page,per_page,
        },
    });
    return data;
};

export const searchGifs = async (q: string,page = 1,per_page = 50) => {
    const { data } = await api.get("/gif/search", {
        params: {
            q,page,per_page,
        },
    });
    return data;
};