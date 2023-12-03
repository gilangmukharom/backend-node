import express from "express";
import {
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  updateLeasedProduct,
  deleteProduct,
  getMyProduct,
  getHisProduct,
  getProductClosest,
} from "../controllers/Products.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/myproducts", verifyUser, getMyProduct);
router.get("/hisproducts/:id", verifyUser, getHisProduct);

router.get("/products", verifyUser, getProduct);
router.get("/products/:id", verifyUser, getProductById);
router.post("/products", verifyUser, createProduct);
router.patch("/products/:id", verifyUser, updateProduct);
router.patch("/leasedproduct/:id", verifyUser, updateLeasedProduct);
router.delete("/products/:id", verifyUser, deleteProduct);
router.get("/closestproducts", verifyUser, getProductClosest);

export default router;
