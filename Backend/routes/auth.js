import express from "express";
import { Login, Register } from "../controllers/auth.controller.js";


const router = express.Router();

router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
]), Register)
router.route('/login').post(Login)

export default router;