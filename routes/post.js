import express from "express";
import formidable from "express-formidable";

import { createPost, uploadImage } from "../contollers/post.js";
import { requireSignin } from "../middleware/index.js";
const router = express.Router();

router.post("/create-post", requireSignin, createPost);
router.post(
  "/upload-image",
  requireSignin,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);

module.exports = router;
