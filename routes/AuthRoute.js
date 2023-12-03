import express from "express";
import {
  Login,
  Logout,
  Me,
  Register,
  updateMe,
  updatePhotoMe,
} from "../controllers/Auth.js";

const router = express.Router();

router.get("/me", Me);
router.patch("/me/:id", updateMe);
router.patch("/photome/:id", updatePhotoMe);
router.post("/login", Login);
router.post("/register", Register);
router.delete("/logout", Logout);

export default router;
