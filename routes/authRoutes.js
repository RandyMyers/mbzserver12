const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");

// Register user (with organization)
router.post('/register', authController.registerUser);

// Login user (with organization code)
router.post("/login", authController.loginUser);

// Register Super Admin
router.post('/super-admin/register', authController.registerSuperAdmin);

// Login Super Admin
router.post('/super/admin/login', authController.loginSuperAdmin);

// Change password for a regular user (with organizationId)
router.post('/change/password', authController.changePassword);

// Change password for a super admin
router.post('/super-admin/change/password', authController.changePasswordSuperAdmin);

module.exports = router;