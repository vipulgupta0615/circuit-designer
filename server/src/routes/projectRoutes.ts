import { Router } from "express";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projectController";

const router = Router();

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);

export default router;
