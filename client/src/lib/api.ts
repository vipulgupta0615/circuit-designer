import type {
  CircuitComponent,
  CircuitConnection,
  SimulationSettings,
} from "@/types/circuit";

export interface CircuitProject {
  id: string;
  name: string;
  description?: string;
  schemaVersion?: number;
  components: CircuitComponent[];
  connections: CircuitConnection[];
  simulationSettings?: SimulationSettings;
  readOnly?: boolean;
  isShared?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message ?? `Project API error (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function saveProject(
  project: Pick<CircuitProject, "name" | "components" | "connections"> & Partial<Pick<CircuitProject, "description" | "schemaVersion" | "simulationSettings">>,
  id?: string | null,
) {
  return request<{ project: CircuitProject }>(
    id ? `/projects/${encodeURIComponent(id)}` : "/projects",
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(project),
    },
  );
}

export function getProject(id: string) {
  return request<{ project: CircuitProject }>(
    `/projects/${encodeURIComponent(id)}`,
  );
}

export function listProjects() {
  return request<{ projects: CircuitProject[] }>("/projects");
}

export function deleteProject(id: string) {
  return request<void>(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createShareLink(id: string) {
  return request<{ token: string; project: CircuitProject }>(
    `/projects/${encodeURIComponent(id)}/share`,
    { method: "POST" },
  );
}

export function getSharedProject(token: string) {
  return request<{ project: CircuitProject }>(`/shared/${encodeURIComponent(token)}`);
}
