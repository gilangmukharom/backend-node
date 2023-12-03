import express from "express";
import {
  getIsRentingProducts,
  getIsRentingProductsById,
  createIsRentingProduct,
  updateIsRentingProductStatus,
  deleteIsRentingProduct,
  getIsRentingProductsByOwner,
  getIsRentingProductsByRenter,
} from "../controllers/IsRentingProducts.js";
import { adminOnly, verifyUser } from "../middleware/AuthUser.js";
import { extractIsRentingProductOwnerId } from "../middleware/ProductAuthorization.js";

const router = express.Router();

router.get("/isrentingproducts", verifyUser, getIsRentingProducts);
router.get(
  "/isrentingproductsbyowner",
  verifyUser,
  getIsRentingProductsByOwner
);
router.get(
  "/isrentingproductsbyrenter",
  verifyUser,
  getIsRentingProductsByRenter
);
router.get("/isrentingproducts/:id", verifyUser, getIsRentingProductsById);
router.post("/isrentingproducts", verifyUser, createIsRentingProduct);
router.patch(
  "/isrentingproducts/:id",
  verifyUser,
  extractIsRentingProductOwnerId,
  updateIsRentingProductStatus
);
router.delete(
  "/isrentingproducts/:id",
  verifyUser,
  extractIsRentingProductOwnerId,
  deleteIsRentingProduct
);

export default router;
