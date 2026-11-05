const componentTypes = new Set(["esp32", "breadboard", "led", "resistor", "dht22"]);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalarProperties(value: unknown): boolean {
  if (!record(value)) return false;
  return Object.values(value).every(
    (item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean",
  );
}

function validComponent(value: unknown): boolean {
  if (!record(value)) return false;
  return (
    typeof value.id === "string" && value.id.length > 0 && value.id.length <= 120 &&
    typeof value.name === "string" && value.name.trim().length > 0 && value.name.length <= 120 &&
    typeof value.type === "string" && componentTypes.has(value.type) &&
    Array.isArray(value.position) && value.position.length === 3 && value.position.every((axis) => typeof axis === "number" && Number.isFinite(axis)) &&
    typeof value.rotation === "number" && Number.isFinite(value.rotation) &&
    scalarProperties(value.properties)
  );
}

function validConnection(value: unknown): boolean {
  if (!record(value) || !record(value.from) || !record(value.to)) return false;
  return (
    typeof value.id === "string" && value.id.length > 0 && value.id.length <= 120 &&
    typeof value.color === "string" && value.color.length <= 32 &&
    typeof value.from.componentId === "string" && typeof value.from.pinId === "string" &&
    typeof value.to.componentId === "string" && typeof value.to.pinId === "string"
  );
}

function validSimulationSettings(value: unknown): boolean {
  if (value === undefined) return true;
  if (!record(value)) return false;
  const states = value.gpioStates;
  const modes = value.gpioModes;
  const statesValid = states === undefined || (record(states) && Object.values(states).every((item) => typeof item === "boolean"));
  const modesValid = modes === undefined || (record(modes) && Object.values(modes).every((item) => item === "INPUT" || item === "OUTPUT"));
  return statesValid && modesValid;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  schemaVersion?: number;
  components: unknown[];
  connections: unknown[];
  simulationSettings?: Record<string, unknown>;
}

export function parseProjectPayload(value: unknown): { value: ProjectPayload } | { error: string } {
  if (!record(value)) return { error: "Project data must be a JSON object." };
  const { name, description, schemaVersion, components, connections, simulationSettings } = value;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    return { error: "Project name must be between 1 and 100 characters." };
  }
  if (description !== undefined && (typeof description !== "string" || description.length > 1000)) {
    return { error: "Project description must be at most 1000 characters." };
  }
  if (schemaVersion !== undefined && (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion) || schemaVersion < 1 || schemaVersion > 100)) {
    return { error: "schemaVersion must be a positive integer." };
  }
  if (!Array.isArray(components) || components.length > 200 || !components.every(validComponent)) {
    return { error: "Components must be a valid array of at most 200 supported components." };
  }
  if (!Array.isArray(connections) || connections.length > 1000 || !connections.every(validConnection)) {
    return { error: "Connections must be a valid array of at most 1000 wires." };
  }
  const componentIds = new Set<string>();
  for (const component of components as Array<Record<string, unknown>>) {
    if (componentIds.has(component.id as string)) return { error: "Component IDs must be unique." };
    componentIds.add(component.id as string);
  }
  for (const connection of connections as Array<{ from: { componentId: string }; to: { componentId: string } }>) {
    if (!componentIds.has(connection.from.componentId) || !componentIds.has(connection.to.componentId)) {
      return { error: "Every connection must reference components in this project." };
    }
  }
  if (!validSimulationSettings(simulationSettings)) return { error: "Simulation settings are invalid." };

  return {
    value: {
      name: name.trim(),
      ...(description === undefined ? {} : { description }),
      ...(schemaVersion === undefined ? {} : { schemaVersion }),
      components,
      connections,
      ...(simulationSettings === undefined ? {} : { simulationSettings: simulationSettings as Record<string, unknown> }),
    },
  };
}
