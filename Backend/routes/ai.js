import express from "express";
import { aiController } from "../controllers/ai.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.route('/ai-content').post(verifyJWT,aiController)

export default router;