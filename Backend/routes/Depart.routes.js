import express from "express";
import { getByOrgId } from "../controllers/Department/Department.controlller.js";


const router = express.Router();

router.route('/org/:orgId').get(getByOrgId);

export default router;