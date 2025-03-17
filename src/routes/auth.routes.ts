import express from "express";
import {
    login,
    logout,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    resetPassword,
    verifyPasswordResetOtp,
    toggleTwoFactorAuth,
    verifyTwoFactorLogin,
    getLoggedInUserData,
    changePassword,
    deleteAccount,
    userSignup, verifySignupOtp 
} from "../controllers/auth.controller";
import { verifyAccessToken } from "../utils/jwt";
import { googleCallback, loginWithGoogle } from "../controllers/googleAuth.controller";

const router = express.Router();

router.post("/signUp", userSignup);
router.post("/verifyOtp", verifySignupOtp);

router.post("/login", login);
router.post("/logout", logout);

router.get("/loggedInUserData", verifyAccessToken, getLoggedInUserData);

router.post("/requestPasswordResetOtp", requestPasswordResetOtp);
router.post("/resendPasswordResetOtp", resendPasswordResetOtp);
router.post("/verifyPasswordResetOtp", verifyPasswordResetOtp);
router.post("/resetPassword", resetPassword);

router.get("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);

router.post('/toggle-2fa', toggleTwoFactorAuth);
router.post('/verify-2fa', verifyTwoFactorLogin);

router.post('/changePassword', verifyAccessToken, changePassword);

router.delete("/deleteAccount", verifyAccessToken, deleteAccount);

export default router;
