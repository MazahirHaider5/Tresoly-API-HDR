"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const vault_controller_1 = require("../controllers/vault.controller");
const router = (0, express_1.Router)();
router.post("/createVault", authenticate_1.verifyToken, vault_controller_1.createVault);
router.get("/getUserVaults", authenticate_1.verifyToken, vault_controller_1.getUserVaults);
router.get("/getUserVaultsDetailsById/:vault_id", authenticate_1.verifyToken, vault_controller_1.getVaultDetailsById);
router.patch("/updateVault/:vaultId", authenticate_1.verifyToken, vault_controller_1.updateVault);
router.delete("/deleteVault/:vaultId", authenticate_1.verifyToken, vault_controller_1.deleteVault);
router.patch("/toggleFavourite/:vaultId", authenticate_1.verifyToken, vault_controller_1.addVaultToFavourites);
router.get("/getFavouriteVaults", authenticate_1.verifyToken, vault_controller_1.getFavouriteVaults);
router.get("/getLatestEditedVaults", authenticate_1.verifyToken, vault_controller_1.getLastestEditedVaults);
router.get("/getAllVaults", vault_controller_1.getAllVaults);
router.get('/categoryCount', vault_controller_1.getVaultCategoryCounts);
router.get('/recentlyUsed', vault_controller_1.getRecentlyUsedVaults);
exports.default = router;
