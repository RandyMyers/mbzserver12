const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationControllers");

// CREATE a new organization
router.post("/create", organizationController.createOrganization);

// GET all organizations
router.get("/all", organizationController.getAllOrganizations);

// GET a specific organization by ID
router.get("/get/:organizationId", organizationController.getOrganizationById);

// UPDATE an organization by ID
router.patch("/update/:organizationId", organizationController.updateOrganization);

// DELETE an organization by ID
router.delete("/delete/:organizationId", organizationController.deleteOrganization);

router.patch('/logo/:organizationId/', organizationController.updateOrganizationLogo);

module.exports = router;
