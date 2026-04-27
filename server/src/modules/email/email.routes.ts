// src/modules/email/email.routes.ts
import { Router } from "express";
import { EmailController } from "./email.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const emailController = new EmailController();

router.use(authenticate);

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


export default router;
