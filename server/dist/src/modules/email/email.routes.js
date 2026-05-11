"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/email/email.routes.ts
const express_1 = require("express");
const email_controller_1 = require("./email.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const emailController = new email_controller_1.EmailController();
router.use(auth_middleware_1.authenticate);
// Templates
router.get("/templates", emailController.getTemplates);
router.get("/templates/:id", emailController.getTemplateById);
router.post("/templates", emailController.createTemplate);
router.put("/templates/:id", emailController.updateTemplate);
router.delete("/templates/:id", emailController.deleteTemplate);
// Recipients
router.get("/recipients", emailController.getRecipients);
// Stats
router.get("/stats", emailController.getStats);
// ✅ Send Email
router.post("/send", emailController.sendEmail);
exports.default = router;
