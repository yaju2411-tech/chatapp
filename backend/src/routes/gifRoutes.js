import express from "express";
import { searchGifs } from "../controllers/gifController/searchGif.js";
import { getTrendingGifs } from "../controllers/gifController/searchTrendingGif.js";

const router = express.Router();

router.get("/search", searchGifs);
router.get("/trending", getTrendingGifs);

export default router;