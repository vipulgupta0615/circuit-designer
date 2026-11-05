import { getPinDefinition } from "@/lib/componentRegistry";
import type { CircuitComponent, CircuitConnection } from "@/types/circuit";

export type CircuitNode = string;

export function nodeId(componentId: string, pinId: string): CircuitNode {
  return `${componentId}:${pinId}`;
}

export class CircuitGraph {
  private readonly adjacency = new Map<CircuitNode, Set<CircuitNode>>();

  addEdge(from: CircuitNode, to: CircuitNode) {
    if (!this.adjacency.has(from)) this.adjacency.set(from, new Set());
    if (!this.adjacency.has(to)) this.adjacency.set(to, new Set());
    this.adjacency.get(from)!.add(to);
    this.adjacency.get(to)!.add(from);
  }

  hasPath(from: CircuitNode, to: CircuitNode): boolean {
    return this.findPath(from, to) !== null;
  }

  findPath(from: CircuitNode, to: CircuitNode): CircuitNode[] | null {
    const queue = [from];
    const visited = new Set<CircuitNode>([from]);
    const previous = new Map<CircuitNode, CircuitNode>();

    while (queue.length) {
      const current = queue.shift()!;
      if (current === to) {
        const path: CircuitNode[] = [];
        let cursor: CircuitNode | undefined = to;
        while (cursor) {
          path.unshift(cursor);
          cursor = previous.get(cursor);
        }
        return path;
      }

      for (const neighbor of this.adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        previous.set(neighbor, current);
        queue.push(neighbor);
      }
    }

    return null;
  }

  static fromCircuit(
    components: CircuitComponent[],
    connections: CircuitConnection[],
    includePassiveComponents: boolean,
  ) {
    const graph = new CircuitGraph();
    const byId = new Map(components.map((component) => [component.id, component]));

    for (const connection of connections) {
      const from = byId.get(connection.from.componentId);
      const to = byId.get(connection.to.componentId);
      if (!from || !to) continue;
      if (!getPinDefinition(from, connection.from.pinId) || !getPinDefinition(to, connection.to.pinId)) continue;
      graph.addEdge(
        nodeId(connection.from.componentId, connection.from.pinId),
        nodeId(connection.to.componentId, connection.to.pinId),
      );
    }

    for (const breadboard of components.filter((component) => component.type === "breadboard")) {
      for (let row = 0; row < 20; row++) {
        for (let column = 0; column < 3; column++) {
          graph.addEdge(nodeId(breadboard.id, `r${row}c${column}`), nodeId(breadboard.id, `r${row}c${column + 1}`));
        }
        for (let column = 4; column < 7; column++) {
          graph.addEdge(nodeId(breadboard.id, `r${row}c${column}`), nodeId(breadboard.id, `r${row}c${column + 1}`));
        }
      }
      for (const rail of ["pos", "neg"] as const) {
        for (let index = 0; index < 19; index++) {
          graph.addEdge(nodeId(breadboard.id, `rail_${rail}_${index}`), nodeId(breadboard.id, `rail_${rail}_${index + 1}`));
        }
      }
    }

    if (includePassiveComponents) {
      for (const resistor of components.filter((component) => component.type === "resistor")) {
        graph.addEdge(nodeId(resistor.id, "pin1"), nodeId(resistor.id, "pin2"));
      }
    }

    return graph;
  }
}
