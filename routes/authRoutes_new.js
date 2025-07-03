const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");

// ========================================
// SUPER ADMIN ROUTES
// ========================================

// Register Super Admin (Platform Owner)
router.post('/super-admin/register', authController.registerSuperAdmin);

// Login Super Admin
router.post('/super-admin/login', authController.loginSuperAdmin);

// Change password for Super Admin
router.post('/super-admin/change/password', authController.changePasswordSuperAdmin);

// ========================================
// ORGANIZATION USER ROUTES
// ========================================

// Register Organization User (Business Owner/Manager)
router.post('/organization/register', authController.registerOrganizationUser);

// Login Organization User
router.post('/organization/login', authController.loginOrganizationUser);

// Change password for Organization User
router.post('/organization/change/password', authController.changePassword);

// ========================================
// AFFILIATE ROUTES
// ========================================

// Register Affiliate User
router.post('/affiliate/register', authController.registerAffiliate);

// Login Affiliate User
router.post('/affiliate/login', authController.loginAffiliate);

// ========================================
// LEGACY ROUTES (for backward compatibility)
// ========================================

// Legacy register user (redirects to organization registration)
router.post('/register', authController.registerUser);

// Legacy login user (redirects to organization login)
router.post('/login', authController.loginUser);

module.exports = router; 