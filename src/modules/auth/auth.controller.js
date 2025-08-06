import { Router } from "express";
import * as authServices from "./auth.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./auth.validation.js";
const router = Router();
router.post("/signup", validation(validators.signup), authServices.signup);
router.patch("/confirm-email", validation(validators.confirmEmail), authServices.confirmEmail);
router.post("/login", validation(validators.login), authServices.login);
router.post("/signup/gmail", validation(validators.loginWithGmail), authServices.signupWithGmail);
router.post("/login/gmail", validation(validators.loginWithGmail), authServices.loginWithGmail);
//router.post("/verification-code", authServices.verificationCode);

export default router;
