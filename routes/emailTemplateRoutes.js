const express = require("express");
const router = express.Router();
const emailTemplateController = require("../controllers/emailTemplateControllers");

router.post("/create", emailTemplateController.createEmailTemplate);
router.get("/all", emailTemplateController.getAllEmailTemplates);
router.get("/get/:emailTemplateId", emailTemplateController.getEmailTemplateById);
router.patch("/update/:emailTemplateId", emailTemplateController.updateEmailTemplate);
router.delete("/delete/:emailTemplateId", emailTemplateController.deleteEmailTemplate);
router.get("/organization/:organizationId", emailTemplateController.getEmailTemplatesByOrganization);


module.exports = router;