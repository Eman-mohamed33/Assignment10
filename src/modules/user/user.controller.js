import { Router } from "express";
import * as userService from "./user.service.js";
import { auth, authentication, authorization } from "../../middleware/authentication.middleware.js";
import { endPoint } from "./user.authorization.js";
import * as validators from "./user.validation.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { validation } from "../../middleware/validation.middleware.js";
import { fileValidation, localFieldUpload } from "../../utils/multer/local.multer.js";
const router = Router();

router.post("/logout", authentication(), validation(validators.logout), userService.logout);
// router.get("/", authentication(), authorization({ accessRoles: endPoint.profile }), userService.profile);
router.get("/", auth({ accessRoles: endPoint.profile }), userService.profile);
router.get("/:userId", validation(validators.shareProfile), userService.shareProfile);
router.patch("/", authentication(), validation(validators.updateBasicInfo), userService.updateBasicInfo);
router.get("/refresh-token", authentication({ tokenType: tokenTypeEnum.refresh }), userService.getNewLoginCredentials);
router.delete("{/:userId}/freeze-account", authentication(), validation(validators.freezeAccount), userService.freezeAccount);
router.patch("/:userId/restore-account", auth({ accessRoles: endPoint.restoreAccount }), validation(validators.restoreAccount), userService.restoreAccount);
router.delete("/:userId", auth({ accessRoles: endPoint.deleteAccount }), validation(validators.deleteAccount), userService.deleteAccount);
router.patch("/update-Password", authentication(), validation(validators.updatePassword), userService.updatePassword);
router.patch("/forgot-Password", validation(validators.sendForgotPassword), userService.sendForgotPassword);
router.patch("/verify-forgot-Password", validation(validators.verifyForgotPassword), userService.verifyForgotPassword);
router.patch("/reset-Password", validation(validators.resetPassword), userService.resetPassword);
router.patch("/profile-image", authentication(), localFieldUpload({ customPath: "User/profile", validation: fileValidation.image }).single("image"), userService.profileImage);


export default router;

