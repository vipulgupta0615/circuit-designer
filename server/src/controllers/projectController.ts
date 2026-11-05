import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Project, { type ProjectDocument } from "../models/Project";
import { parseProjectPayload } from "../validation/projectValidation";

function databaseUnavailable(res: Response) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({
    message: "Project storage is unavailable. Configure MONGODB_URI and restart the API.",
  });
  return true;
}

function toProjectResponse(project: ProjectDocument, options: { shared?: boolean } = {}) {
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    schemaVersion: project.schemaVersion,
    components: project.components,
    connections: project.connections,
    simulationSettings: project.simulationSettings,
    ...(options.shared ? { readOnly: true } : { isShared: Boolean(project.publicShareToken) }),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function createProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  const parsed = parseProjectPayload(req.body);
  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  try {
    const project = await Project.create({
      ...parsed.value,
    });
    res.status(201).json({ project: toProjectResponse(project) });
  } catch (error) {
    console.error("Could not create project:", error);
    res.status(500).json({ message: "Could not save this project." });
  }
}

export async function listProjects(_req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  try {
    const projects = await Project.find().sort({ updatedAt: -1 }).limit(50);
    res.json({
      projects: projects.map((project) => toProjectResponse(project)),
    });
  } catch (error) {
    console.error("Could not list projects:", error);
    res.status(500).json({ message: "Could not load saved projects." });
  }
}

export async function getProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "The project ID is invalid." });
    return;
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found." });
      return;
    }
    res.json({ project: toProjectResponse(project) });
  } catch (error) {
    console.error("Could not load project:", error);
    res.status(500).json({ message: "Could not load this project." });
  }
}

export async function updateProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "The project ID is invalid." });
    return;
  }
  const parsed = parseProjectPayload(req.body);
  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      parsed.value,
      { new: true, runValidators: true },
    );
    if (!project) {
      res.status(404).json({ message: "Project not found." });
      return;
    }
    res.json({ project: toProjectResponse(project) });
  } catch (error) {
    console.error("Could not update project:", error);
    res.status(500).json({ message: "Could not update this project." });
  }
}

export async function deleteProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "The project ID is invalid." });
    return;
  }
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error("Could not delete project:", error);
    res.status(500).json({ message: "Could not delete this project." });
  }
}

export async function shareProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "The project ID is invalid." });
    return;
  }
  try {
    const token = randomBytes(24).toString("base64url");
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { publicShareToken: token },
      { new: true, runValidators: true },
    ).select("+publicShareToken");
    if (!project) {
      res.status(404).json({ message: "Project not found." });
      return;
    }
    res.status(201).json({ token, project: toProjectResponse(project) });
  } catch (error) {
    console.error("Could not create project share link:", error);
    res.status(500).json({ message: "Could not create a share link for this project." });
  }
}

export async function getSharedProject(req: Request, res: Response) {
  const token = req.params.token;
  if (!token || token.length > 128) {
    res.status(400).json({ message: "The share token is invalid." });
    return;
  }
  if (databaseUnavailable(res)) return;
  try {
    const project = await Project.findOne({ publicShareToken: token }).select("+publicShareToken");
    if (!project) {
      res.status(404).json({ message: "Shared project not found." });
      return;
    }
    res.json({ project: toProjectResponse(project, { shared: true }) });
  } catch (error) {
    console.error("Could not load shared project:", error);
    res.status(500).json({ message: "Could not load this shared project." });
  }
}
