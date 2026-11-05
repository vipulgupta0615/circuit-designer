import { getPinDefinition } from "@/lib/componentRegistry";
import type { CircuitComponent, CircuitConnection, PinReference } from "@/types/circuit";
import { CircuitGraph, nodeId } from "./CircuitGraph";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface SimulationDiagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
}

export interface ConnectionValidation {
  diagnostics: SimulationDiagnostic[];
  conductiveGraph: CircuitGraph;
  electricalGraph: CircuitGraph;
}

export function canUsePin(component: CircuitComponent | undefined, pinId: string): boolean {
  const pin = component && getPinDefinition(component, pinId);
  return Boolean(pin && pin.kind !== "no-connect");
}

export function validateNewConnection(
  components: CircuitComponent[],
  from: PinReference,
  to: PinReference,
): string | null {
  const byId = new Map(components.map((component) => [component.id, component]));
  const fromComponent = byId.get(from.componentId);
  const toComponent = byId.get(to.componentId);
  if (!canUsePin(fromComponent, from.pinId) || !canUsePin(toComponent, to.pinId)) {
    return "That pin is unavailable or marked NC and cannot be wired.";
  }
  if (from.componentId === to.componentId && from.pinId === to.pinId) {
    return "A pin cannot be wired to itself.";
  }
  return null;
}

export function validateCircuit(
  components: CircuitComponent[],
  connections: CircuitConnection[],
): ConnectionValidation {
  const diagnostics: SimulationDiagnostic[] = [];
  const byId = new Map<string, CircuitComponent>();
  for (const component of components) {
    if (byId.has(component.id)) {
      diagnostics.push({ code: "DUPLICATE_COMPONENT_ID", severity: "error", message: `Duplicate component ID: ${component.id}.` });
    }
    byId.set(component.id, component);
  }

  const seenConnections = new Set<string>();
  for (const connection of connections) {
    const from = byId.get(connection.from.componentId);
    const to = byId.get(connection.to.componentId);
    if (!from || !to || !getPinDefinition(from, connection.from.pinId) || !getPinDefinition(to, connection.to.pinId)) {
      diagnostics.push({ code: "INVALID_PIN_REFERENCE", severity: "error", message: `Wire ${connection.id} refers to a missing component or pin.` });
      continue;
    }
    const key = [nodeId(connection.from.componentId, connection.from.pinId), nodeId(connection.to.componentId, connection.to.pinId)].sort().join("|");
    if (seenConnections.has(key)) {
      diagnostics.push({ code: "DUPLICATE_WIRE", severity: "warning", message: `Duplicate wire detected at ${key}.` });
    }
    seenConnections.add(key);
    if (!canUsePin(from, connection.from.pinId) || !canUsePin(to, connection.to.pinId)) {
      diagnostics.push({ code: "NO_CONNECT_PIN", severity: "error", message: `Wire ${connection.id} is connected to a no-connect pin.` });
    }
  }

  const conductiveGraph = CircuitGraph.fromCircuit(components, connections, false);
  const electricalGraph = CircuitGraph.fromCircuit(components, connections, true);
  const esp32Boards = components.filter((component) => component.type === "esp32");
  for (const esp32 of esp32Boards) {
    if (conductiveGraph.hasPath(nodeId(esp32.id, "3V3"), nodeId(esp32.id, "GND"))) {
      diagnostics.push({
        code: "POWER_GROUND_SHORT",
        severity: "error",
        message: `${esp32.name}: 3V3 is directly shorted to GND through wires or breadboard nets.`,
      });
    }
  }

  return { diagnostics, conductiveGraph, electricalGraph };
}
