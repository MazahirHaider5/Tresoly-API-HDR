import { Router } from "express";
import { verifyToken } from "../middlewares/authenticate";
import { createVault, deleteVault, getAllVaults, getUserVaults, updateVault, getVaultCategoryCounts, getRecentlyUsedVaults, addVaultToFavourites, getFavouriteVaults, getLastestEditedVaults, getVaultDetailsById } from "../controllers/vault.controller";


const router = Router();

router.post("/createVault", verifyToken, createVault);
router.get("/getUserVaults",verifyToken, getUserVaults);
router.get("/getUserVaultsDetailsById/:vault_id", verifyToken, getVaultDetailsById);

router.patch("/updateVault/:vaultId",verifyToken, updateVault);
router.delete("/deleteVault/:vaultId", verifyToken, deleteVault);

router.patch("/toggleFavourite/:vaultId", verifyToken, addVaultToFavourites);
router.get("/getFavouriteVaults", verifyToken, getFavouriteVaults);

router.get("/getLatestEditedVaults", verifyToken, getLastestEditedVaults);

router.get("/getAllVaults", getAllVaults);
router.get('/categoryCount', getVaultCategoryCounts);
router.get('/recentlyUsed', getRecentlyUsedVaults);


export default router;
  


