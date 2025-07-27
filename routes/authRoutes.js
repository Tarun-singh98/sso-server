const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/check", authController.check);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post('/sso-login', authController.ssoLogin);
router.get("/verify", authController.verify);

module.exports = router;
