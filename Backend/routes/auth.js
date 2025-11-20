import express from "express";
import { GetMe, Login, Register } from "../controllers/auth.controller.js";
import { upload } from '../middlewares/upload.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
]), Register)
router.route('/login').post(Login)
router.route('/profile').get(verifyJWT, GetMe)

export default router;