import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  authorizeDownload,
  downloadFile,
  downloadSongById,
} from "../controller/download.controller.js";

const router = Router();

router.use(protectRoute);

router.post("/authorize", authorizeDownload);
router.get("/file", downloadFile);
router.get("/song/:id", downloadSongById);

export default router;
