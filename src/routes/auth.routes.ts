import express from "express";
import {
    login,
    logout,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    resetPassword,
    verifyPasswordResetOtp
} from "../controllers/auth.controller";
import { verifyAccessToken } from "../utils/jwt";
import { userSignup, verifySignupOtp } from "../controllers/auth.controller";
import { googleCallback, loginWithGoogle } from "../controllers/googleAuth.controller";

const router = express.Router();

router.post("/signUp", userSignup);
router.post("/verifyOtp", verifySignupOtp);

router.post("/login", login);
router.post("/logout", logout);

router.post("/requestPasswordResetOtp", requestPasswordResetOtp);
router.post("/resendPasswordResetOtp", resendPasswordResetOtp);
router.post("/verifyPasswordResetOtp", verifyPasswordResetOtp);
router.post("/resetPassword", resetPassword);

router.get("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);


export default router;
