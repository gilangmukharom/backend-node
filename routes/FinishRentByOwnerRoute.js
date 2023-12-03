import express from "express";
import {
  getFinishRentByOwner,
  createFinishRentByOwner,
  deleteFinishRentByOwner,
} from "../controllers/FinishRentByOwner.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/finishrentbyowner", verifyUser, getFinishRentByOwner);
router.post("/finishrentbyowner", verifyUser, createFinishRentByOwner);
router.delete("/finishrentbyowner/:id", verifyUser, deleteFinishRentByOwner);

export default router;
