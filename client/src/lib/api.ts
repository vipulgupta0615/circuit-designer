import type { CircuitComponent, CircuitConnection } from "@/types/circuit";

export interface CircuitProject {
  id: string;
  name: string;
  components: CircuitComponent[];
  connections: CircuitConnection[];
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

  return response.json() as Promise<T>;
}

export function saveProject(
  project: Pick<CircuitProject, "name" | "components" | "connections">,
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
