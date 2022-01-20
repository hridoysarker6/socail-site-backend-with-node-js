import express from "express";
import {
  register,
  login,
  currentUser,
  forgotPassword,
  profileUpdate,
  findPeople,
  addFollower,
  userFollow,
  userfollowing,
  removeFollower,
  userUnfollow,
  searchUser,
  getUser,
} from "../contollers/auth.js";
import { isAdmin, requireSignin } from "../middleware/index.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

router.get("/current-user", requireSignin, currentUser);

router.put("/profile-update", requireSignin, profileUpdate);
router.get("/find-people", requireSignin, findPeople);

router.put("/user-follow", requireSignin, addFollower, userFollow);
router.put("/user-unfollow", requireSignin, removeFollower, userUnfollow);

router.get("/user-following", requireSignin, userfollowing);

router.get("/search-user/:query", searchUser);
router.get("/user/:userName", getUser);

// admin
router.get("/current-admin", requireSignin, isAdmin, currentUser);

module.exports = router;
