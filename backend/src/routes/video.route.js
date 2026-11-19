import { Router } from "express";
import { getPublicVideo, listPublicVideos } from "../controller/media.controller.js";

const router = Router();

router.get("/", listPublicVideos);
router.get("/:id", getPublicVideo);

export default router;
