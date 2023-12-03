import express from "express";
import {
  getFinishRentByRenter,
  createFinishRentByRenter,
  deleteFinishRentByRenter,
} from "../controllers/FinishRentByRenter.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/finishrentbyrenter", verifyUser, getFinishRentByRenter);
router.post("/finishrentbyrenter", verifyUser, createFinishRentByRenter);
router.delete("/finishrentbyrenter/:id", verifyUser, deleteFinishRentByRenter);

export default router;
