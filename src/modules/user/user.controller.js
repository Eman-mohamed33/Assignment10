import { Router } from "express";
import * as userService from "./user.service.js";
import { auth, authentication, authorization } from "../../middleware/authentication.middleware.js";
import { endPoint } from "./user.authorization.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
const router = Router();

// router.get("/", authentication(), authorization({ accessRoles: endPoint.profile }), userService.profile);
router.get("/", auth({ accessRoles: endPoint.profile }), userService.profile);
router.get("/refresh-token", authentication({ tokenType: tokenTypeEnum.refresh }), userService.getNewLoginCredentials);
router.post("/updatePassword", userService.updatePassword);
// router.post("/sendEmail", userService.sendEmail);


export default router;

