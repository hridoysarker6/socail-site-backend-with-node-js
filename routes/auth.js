import express from "express";
import { register, login, currentUser } from "../contollers/auth.js";
import { requireSignin } from "../middleware/index.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/current-user", requireSignin, currentUser);

module.exports = router;
