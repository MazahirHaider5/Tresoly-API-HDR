import { Router } from "express";
import { verifyToken } from "../middlewares/authenticate";
import { createVault, deleteVault, getAllVaults, getUserVaults, updateVault } from "../controllers/vault.controller";


const router = Router();

router.post("/createVault", verifyToken, createVault);
router.get("/getUserVaults",verifyToken, getUserVaults);
router.patch("/updateVault/:vaultId",verifyToken, updateVault);
router.delete("/deleteVault/:vaultId", verifyToken, deleteVault);

router.get("/getAllVaults", getAllVaults);


export default router;
