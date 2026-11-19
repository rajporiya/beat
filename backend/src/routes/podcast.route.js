import { Router } from "express";
import { getPublicPodcast, listPublicPodcasts } from "../controller/media.controller.js";

const router = Router();

router.get("/", listPublicPodcasts);
router.get("/:id", getPublicPodcast);

export default router;
