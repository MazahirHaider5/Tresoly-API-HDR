import { Router } from "express";
import { verifyToken } from "../middlewares/authenticate";
import {
  changePassword,
  deleteAccount,
  getUsers,
  toggleBiometricAuth,
  updateSpecificFields,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/allUsers", getUsers);
router.patch("/updateUserProfile", verifyToken, updateUser);

router.patch("/updateSpecificDetails", verifyToken, updateSpecificFields);

router.patch("/toggleBioMatricAuth/:userId", verifyToken, toggleBiometricAuth);

router.delete("/deleteAccount",verifyToken, deleteAccount);

router.post("/changePassword", verifyToken, changePassword);


export default router;
