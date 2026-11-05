"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  CircleHelp,
  Cloud,
  Copy,
  FileUp,
  FolderOpen,
  House,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import ComponentLibrary from "./ComponentLibrary";
import PropertiesPanel from "./PropertiesPanel";
import SimulationConsole from "./SimulationConsole";
import { useCircuitStore } from "@/store/circuitStore";
import {
  createShareLink,
  deleteProject as deleteProjectRequest,
  getProject,
  getSharedProject,
  listProjects,
  saveProject,
} from "@/lib/api";
import type {
  CircuitComponent,
  CircuitConnection,
} from "@/types/circuit";
import type { CircuitProject } from "@/lib/api";

const Scene = dynamic(() => import("@/components/three/Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing your 3D workbench…</div>,
});

type Notice = { kind: "success" | "error" | "info"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasScalarProperties(value: unknown): value is Record<string, string | number | boolean> {
  return isRecord(value) && Object.values(value).every(
    (property) => typeof property === "string" || typeof property === "number" || typeof property === "boolean",
  );
}

function isCircuitComponent(value: unknown): value is CircuitComponent {
  if (!isRecord(value)) return false;
  const componentTypes: string[] = [
    "esp32",
    "breadboard",
    "led",
    "resistor",
    "dht22",
  ];
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    componentTypes.includes(value.type) &&
    Array.isArray(value.position) &&
    value.position.length === 3 &&
    value.position.every((axis) => typeof axis === "number" && Number.isFinite(axis)) &&
    typeof value.rotation === "number" &&
    hasScalarProperties(value.properties)
  );
}

function isCircuitConnection(value: unknown): value is CircuitConnection {
  if (!isRecord(value) || !isRecord(value.from) || !isRecord(value.to)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.color === "string" &&
    typeof value.from.componentId === "string" &&
    typeof value.from.pinId === "string" &&
    typeof value.to.componentId === "string" &&
    typeof value.to.pinId === "string"
  );
}

function isProjectFile(
  value: unknown,
): value is Omit<CircuitProject, "id"> & { id?: unknown } {
  if (!isRecord(value)) return false;
  if (!(
    typeof value.name === "string" &&
    Array.isArray(value.components) &&
    value.components.every(isCircuitComponent) &&
    Array.isArray(value.connections) &&
    value.connections.every(isCircuitConnection)
  )) return false;

  const componentIds = new Set(value.components.map((component) => component.id));
  return componentIds.size === value.components.length && value.connections.every(
    (connection) => componentIds.has(connection.from.componentId) && componentIds.has(connection.to.componentId),
  );
}

export default function CircuitEditor() {
  const components = useCircuitStore((state) => state.components);
  const connections = useCircuitStore((state) => state.connections);
  const projectId = useCircuitStore((state) => state.projectId);
  const projectName = useCircuitStore((state) => state.projectName);
  const setProjectName = useCircuitStore((state) => state.setProjectName);
  const setCircuit = useCircuitStore((state) => state.setCircuit);
  const resetWorkspace = useCircuitStore((state) => state.resetWorkspace);
  const startSimulation = useCircuitStore((state) => state.startSimulation);
  const stopSimulation = useCircuitStore((state) => state.stopSimulation);
  const resetSimulation = useCircuitStore((state) => state.resetSimulation);
  const isRunning = useCircuitStore((state) => state.isRunning);
  const pendingPin = useCircuitStore((state) => state.pendingPin);
  const connectionFeedback = useCircuitStore((state) => state.connectionFeedback);
  const isReadOnly = useCircuitStore((state) => state.isReadOnly);
  const gpioStates = useCircuitStore((state) => state.gpioStates);
  const gpioModes = useCircuitStore((state) => state.gpioModes);
  const forkSharedProject = useCircuitStore((state) => state.forkSharedProject);
  const fileInput = useRef<HTMLInputElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const resetCancelButton = useRef<HTMLButtonElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [isProjectMenuOpen, setProjectMenuOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isLoadingProjects, setLoadingProjects] = useState(false);
  const [savedProjects, setSavedProjects] = useState<CircuitProject[]>([]);

  useEffect(() => {
    if (!isResetDialogOpen) return;

    const dialog = resetDialog.current;
    if (!dialog) return;
    const trigger = resetTrigger.current;

    dialog.showModal();
    resetCancelButton.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      trigger?.focus();
    };
  }, [isResetDialogOpen]);

  const loadProject = useCallback(
    (project: CircuitProject) => {
      setCircuit(project, false);
      setProjectMenuOpen(false);
      setNotice({ kind: "success", message: `Opened “${project.name}”.` });
      window.history.replaceState(null, "", `/editor?project=${project.id}`);
    },
    [setCircuit],
  );

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const sharedToken = search.get("share");
    const projectToLoad = search.get("project");
    if (sharedToken) {
      getSharedProject(sharedToken)
        .then(({ project }) => {
          setCircuit(project, true);
          setNotice({ kind: "info", message: `Opened read-only shared project “${project.name}”.` });
        })
        .catch((error: unknown) => {
          setNotice({ kind: "error", message: error instanceof Error ? error.message : "Could not load the shared project." });
        });
      return;
    }
    if (!projectToLoad) {
      void Promise.resolve()
        .then(() => {
          const stored = localStorage.getItem("circuit-designer:last-project");
          if (stored) {
            const parsed: unknown = JSON.parse(stored);
            if (isProjectFile(parsed)) {
              setCircuit({
                ...parsed,
                id: typeof parsed.id === "string" ? parsed.id : null,
              });
            }
          }
        })
        .catch((error: unknown) => {
          setNotice({ kind: "error", message: "The saved project on this device could not be read." });
          console.error("Could not read the last local project:", error);
        });
      return;
    }

    getProject(projectToLoad)
      .then(({ project }) => loadProject(project))
      .catch((error: unknown) => {
        setNotice({
          kind: "error",
          message: error instanceof Error ? error.message : "Could not load the shared project.",
        });
      });
  }, [loadProject, setCircuit]);

  const handleSave = async (asNew = false) => {
    if (isReadOnly) {
      setNotice({ kind: "info", message: "Fork this shared project before saving changes." });
      return;
    }
    if (!projectName.trim()) {
      setNotice({ kind: "error", message: "Give this project a name before saving." });
      return;
    }
    setSaving(true);
    const project = {
      name: projectName.trim(),
      components,
      connections,
      schemaVersion: 1,
      simulationSettings: { gpioStates, gpioModes },
    };

    try {
      const { project: saved } = await saveProject(
        project,
        asNew || projectId?.startsWith("local-") ? null : projectId,
      );
      setCircuit(saved);
      localStorage.setItem("circuit-designer:last-project", JSON.stringify(saved));
      window.history.replaceState(null, "", `/editor?project=${saved.id}`);
      setNotice({ kind: "success", message: "Saved to your project library." });
    } catch (apiError) {
      try {
        const localProject = { id: null, ...project };
        localStorage.setItem(
          "circuit-designer:last-project",
          JSON.stringify(localProject),
        );
        setCircuit(localProject);
        setNotice({
          kind: "info",
          message: "Saved on this device. Connect the MongoDB API to sync and share.",
        });
        console.error("Project API save failed; saved locally instead:", apiError);
      } catch (storageError) {
        setNotice({
          kind: "error",
          message: "Could not save this project locally or to the project API.",
        });
        console.error("Project save failed:", { apiError, storageError });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetWorkspace = () => {
    try {
      localStorage.removeItem("circuit-designer:last-project");
    } catch (error) {
      setNotice({
        kind: "error",
        message: "Could not clear this device's saved project, so the workspace was not reset.",
      });
      console.error("Could not clear the last local project before workspace reset:", error);
      return;
    }

    resetWorkspace();
    window.history.replaceState(null, "", "/editor");
    setNotice({ kind: "success", message: "Workspace reset to the starter circuit." });
  };

  const handleOpenProjects = async () => {
    setProjectMenuOpen(true);
    setLoadingProjects(true);
    try {
      const result = await listProjects();
      setSavedProjects(result.projects);
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not load saved projects.",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isProjectFile(parsed)) {
        throw new Error("This file is not a valid Circuit Designer project.");
      }
      setCircuit({ ...parsed, id: null });
      setNotice({ kind: "success", message: `Imported “${parsed.name}”. Save to keep your changes.` });
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not import that project file.",
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleExport = () => {
    const file = new Blob(
      [JSON.stringify({ name: projectName, schemaVersion: 1, components, connections, simulationSettings: { gpioStates, gpioModes } }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectName.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "circuit-project"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice({ kind: "success", message: "Project file exported." });
  };

  const handleShare = async () => {
    if (!projectId || projectId.startsWith("local-")) {
      setNotice({ kind: "info", message: "Save to the MongoDB project library first to create a shareable link." });
      return;
    }
    try {
      const { token } = await createShareLink(projectId);
      await navigator.clipboard.writeText(`${window.location.origin}/editor?share=${token}`);
      setNotice({ kind: "success", message: "Share link copied to clipboard." });
    } catch (error) {
      setNotice({ kind: "error", message: "Clipboard access failed. Copy the project URL from your browser." });
      console.error("Could not copy share link:", error);
    }
  };

  const handleDeleteProject = async (project: CircuitProject) => {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    try {
      await deleteProjectRequest(project.id);
      setSavedProjects((items) => items.filter((item) => item.id !== project.id));
      if (projectId === project.id) {
        resetWorkspace();
        window.history.replaceState(null, "", "/editor");
      }
      setNotice({ kind: "success", message: `Deleted “${project.name}”.` });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Could not delete this project." });
    }
  };

  return (
    <main className="circuit-app">
      <header className="editor-header">
        <Link className="brand-lockup" href="/" aria-label="Circuit Studio home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span className="brand-name">circuit<span>studio</span></span>
          <span className="brand-divider" />
          <span className="editor-label">WORKSPACE</span>
        </Link>

        <div className="project-heading">
          <input
            aria-label="Project name"
            className="project-name-input"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
          <span className="project-meta"><span className="saved-dot" /> {components.length} parts <span className="meta-separator">·</span> {connections.length} connections</span>
          {isReadOnly && <span className="project-meta">PUBLIC READ-ONLY VIEW</span>}
        </div>

        <div className="header-actions">
          <button className="header-icon-button open-project-button" onClick={handleOpenProjects} title="Open a saved project">
            <FolderOpen size={16} /><span>Open</span>
          </button>
          <button className="header-icon-button" onClick={handleExport} title="Export project JSON">
            <ArrowDownToLine size={16} /><span>Export</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
          <button className="header-icon-button import-button" onClick={() => fileInput.current?.click()} title="Import project JSON">
            <FileUp size={16} /><span>Import</span>
          </button>
          <button className="header-icon-button share-button" onClick={() => void handleShare()} title="Copy shareable URL">
            <Copy size={15} /><span>Share</span>
          </button>
          <span className="header-separator" />
          {isReadOnly ? (
            <button className="save-button" onClick={forkSharedProject}>Fork to edit</button>
          ) : (
          <button className="save-button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving" : "Save"}
          </button>
          )}
          <button
            className="header-icon-button"
            onClick={() => void handleSave(true)}
            disabled={saving || isReadOnly}
            aria-label="Save as new project"
            title="Save as new project"
          >
            <Save size={16} /><span>Save as new</span>
          </button>
          <button className={`run-button ${isRunning ? "is-running" : ""}`} onClick={isRunning ? stopSimulation : startSimulation} disabled={isReadOnly}>
            {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            {isRunning ? "Stop" : "Run"}
          </button>
          <button className="reset-button" onClick={resetSimulation} title="Reset simulation" disabled={isReadOnly}><RotateCcw size={16} /></button>
          <button
            className="header-icon-button"
            ref={resetTrigger}
            onClick={() => setResetDialogOpen(true)}
            title="Reset workspace to starter circuit"
            aria-label="Reset workspace to starter circuit"
          >
            <House size={16} /><span>Reset workspace</span>
          </button>
        </div>
      </header>

      <div className="editor-main">
        <ComponentLibrary />

        <section className="workspace-area" aria-label="3D circuit workspace">
          <div className="workspace-topline">
            <div className="workspace-caption">
              <span className="live-indicator" />
              <span>3D WORKSPACE</span>
              <span className="caption-divider">/</span>
              <span className="camera-hint">Orbit to explore · scroll to zoom</span>
            </div>
            <div className="connection-status"><Wifi size={13} /> {isRunning ? "SIMULATION ACTIVE" : "READY TO SIMULATE"}</div>
          </div>
          <Scene />
          {pendingPin && (
            <div className="wire-hint">
              <span className="wire-hint-dot" />
              Choose a second pin to complete the wire
              <button onClick={() => useCircuitStore.getState().cancelPinSelection()} aria-label="Cancel wire"><X size={14} /></button>
            </div>
          )}
          {!pendingPin && connectionFeedback && (
            <div className="connection-feedback" role="status">{connectionFeedback}</div>
          )}
          <div className="workspace-controls">
            <span><kbd>Click</kbd> pin to wire</span>
            <span className="controls-separator" />
            <span><kbd>Drag</kbd> to move</span>
            <span className="controls-separator" />
            <span><kbd>Scroll</kbd> to zoom</span>
          </div>
          <div className="workspace-count"><span>{String(components.length).padStart(2, "0")}</span> COMPONENTS</div>
        </section>

        <PropertiesPanel />
      </div>

      <footer className="console-dock">
        <SimulationConsole />
      </footer>

      {notice && (
        <div className={`toast toast-${notice.kind}`} role="status">
          <span className="toast-indicator" />
          <span>{notice.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={15} /></button>
        </div>
      )}

      {isProjectMenuOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setProjectMenuOpen(false);
        }}>
          <section className="projects-dialog" role="dialog" aria-modal="true" aria-labelledby="projects-title">
            <div className="dialog-heading">
              <div><p className="eyebrow">PROJECT LIBRARY</p><h2 id="projects-title">Your saved circuits</h2></div>
              <button className="dialog-close" onClick={() => setProjectMenuOpen(false)} aria-label="Close saved projects"><X size={18} /></button>
            </div>
            <div className="saved-project-list">
              {isLoadingProjects ? (
                <div className="dialog-empty"><LoaderCircle className="spin" size={22} /> Connecting to project library…</div>
              ) : savedProjects.length ? (
                savedProjects.map((project) => (
                  <div className="saved-project-row" key={project.id}>
                  <button className="saved-project-open" onClick={() => loadProject(project)}>
                    <span className="project-row-icon"><Zap size={17} /></span>
                    <span className="saved-project-copy"><strong>{project.name}</strong><small>{project.components.length} components · {project.connections.length} wires</small></span>
                    <span className="open-arrow">↗</span>
                  </button>
                  <button className="project-delete-button" title={`Delete ${project.name}`} aria-label={`Delete ${project.name}`} onClick={() => void handleDeleteProject(project)}><Trash2 size={15} /></button>
                  </div>
                ))
              ) : (
                <div className="dialog-empty"><Cloud size={24} /><span>No cloud projects found.</span><small>Check your MongoDB API connection, or import a project file.</small></div>
              )}
            </div>
            <div className="dialog-footer"><CircleHelp size={14} /> Cloud projects are saved in your MongoDB workspace.</div>
          </section>
        </div>
      )}

      {isResetDialogOpen && (
        <dialog
          ref={resetDialog}
          className="reset-confirm-dialog"
          aria-labelledby="reset-dialog-title"
          aria-describedby="reset-dialog-description"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setResetDialogOpen(false);
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            setResetDialogOpen(false);
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            ) {
              setResetDialogOpen(false);
            }
          }}
        >
          <div className="reset-dialog-icon"><RotateCcw size={19} /></div>
          <p className="eyebrow">STARTER CIRCUIT</p>
          <h2 id="reset-dialog-title">Reset this workspace?</h2>
          <p className="reset-dialog-description" id="reset-dialog-description">
            Your current layout and unsaved changes will be replaced with the starter circuit.
          </p>
          <div className="reset-dialog-note">
            <Cloud size={15} />
            <span>Your saved cloud projects will not be deleted.</span>
          </div>
          <div className="reset-dialog-actions">
            <button
              ref={resetCancelButton}
              className="reset-dialog-cancel"
              onClick={() => setResetDialogOpen(false)}
            >
              Keep editing
            </button>
            <button
              className="reset-dialog-confirm"
              onClick={() => {
                setResetDialogOpen(false);
                handleResetWorkspace();
              }}
            >
              <RotateCcw size={14} />
              Reset workspace
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
}
