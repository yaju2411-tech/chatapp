import { useQuery } from "@tanstack/react-query";
import {getTrendingGifs,searchGifs,} from "../service/gifApi";

export const useTrendingGifs = () => {
    return useQuery({
        queryKey: ["trending-gifs"],
        queryFn: () => getTrendingGifs(),
        staleTime:1000*60*10,
        gcTime:1000*60*30,
        refetchOnWindowFocus:false,
        retry:false,
    });
};

export const useSearchGifs = (search: string) => {
    return useQuery({
        queryKey: ["search-gifs", search],
        queryFn: () => searchGifs(search),
        staleTime:1000*60*10,
        gcTime:1000*60*30,
        refetchOnWindowFocus:false,
        retry:false,
        enabled: !!search,
    });

};