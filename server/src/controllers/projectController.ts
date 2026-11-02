import type { Request, Response } from "express";
import mongoose from "mongoose";
import Project from "../models/Project";

function databaseUnavailable(res: Response) {
  if (mongoose.connection.readyState === 1) return false;
  res.status(503).json({
    message: "Project storage is unavailable. Configure MONGODB_URI and restart the API.",
  });
  return true;
}

function toProjectResponse(project: InstanceType<typeof Project>) {
  return {
    id: project.id,
    name: project.name,
    components: project.components,
    connections: project.connections,
    updatedAt: project.updatedAt,
  };
}

function isProjectPayload(
  value: unknown,
): value is { name: string; components: unknown[]; connections: unknown[] } {
  if (typeof value !== "object" || value === null) return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.name === "string" &&
    project.name.trim().length > 0 &&
    project.name.trim().length <= 100 &&
    Array.isArray(project.components) &&
    Array.isArray(project.connections)
  );
}

export async function createProject(req: Request, res: Response) {
  if (databaseUnavailable(res)) return;
  if (!isProjectPayload(req.body)) {
    res.status(400).json({ message: "A project name, components, and connections are required." });
    return;
  }

  try {
    const project = await Project.create({
      name: req.body.name.trim(),
      components: req.body.components,
      connections: req.body.connections,
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
  if (!isProjectPayload(req.body)) {
    res.status(400).json({ message: "A project name, components, and connections are required." });
    return;
  }

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name.trim(),
        components: req.body.components,
        connections: req.body.connections,
      },
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
