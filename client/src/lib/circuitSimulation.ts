import type { CircuitComponent, CircuitConnection } from "@/types/circuit";
import { isValidComponentPin } from "@/lib/componentCatalog";

export interface SimulationResult {
  ledOn: boolean;
  dht22Connected: boolean;
  temperature: number | null;
  humidity: number | null;
  logs: string[];
}

type PinNode = string;

function getNumericProperty(
  component: CircuitComponent,
  key: string,
  fallback: number,
): number {
  const value = component.properties[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function getBooleanProperty(
  component: CircuitComponent,
  key: string,
  fallback: boolean,
): boolean {
  const value = component.properties[key];
  return typeof value === "boolean" ? value : fallback;
}

function getNode(componentId: string, pinId: string): PinNode {
  return `${componentId}:${pinId}`;
}

function addEdge(graph: Map<PinNode, Set<PinNode>>, a: PinNode, b: PinNode) {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());

  graph.get(a)!.add(b);
  graph.get(b)!.add(a);
}

function findPath(
  graph: Map<PinNode, Set<PinNode>>,
  start: PinNode,
  end: PinNode,
): PinNode[] | null {
  const queue: PinNode[] = [start];
  const visited = new Set<PinNode>([start]);
  const previous = new Map<PinNode, PinNode>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === end) {
      const path: PinNode[] = [];
      let node: PinNode | undefined = end;

      while (node !== undefined) {
        path.unshift(node);
        node = previous.get(node);
      }

      return path;
    }

    for (const neighbor of graph.get(current) ?? []) {
      if (visited.has(neighbor)) continue;

      visited.add(neighbor);
      previous.set(neighbor, current);
      queue.push(neighbor);
    }
  }

  return null;
}

function isConnected(
  graph: Map<PinNode, Set<PinNode>>,
  start: PinNode,
  end: PinNode,
): boolean {
  return findPath(graph, start, end) !== null;
}

/**
 * Breadboard electrical layout:
 * - 20 rows
 * - 8 holes per row
 * - Columns 0-3 are internally connected.
 * - Columns 4-7 are internally connected.
 * - The center gap separates the two groups.
 */
function addBreadboardConnections(
  graph: Map<PinNode, Set<PinNode>>,
  breadboard: CircuitComponent,
) {
  for (let row = 0; row < 20; row++) {
    // Left group: columns 0, 1, 2, 3
    for (let col = 0; col < 3; col++) {
      addEdge(
        graph,
        getNode(breadboard.id, `r${row}c${col}`),
        getNode(breadboard.id, `r${row}c${col + 1}`),
      );
    }

    // Right group: columns 4, 5, 6, 7
    for (let col = 4; col < 7; col++) {
      addEdge(
        graph,
        getNode(breadboard.id, `r${row}c${col}`),
        getNode(breadboard.id, `r${row}c${col + 1}`),
      );
    }
  }
}

export function evaluateCircuit(
  components: CircuitComponent[],
  connections: CircuitConnection[],
  gpioStates: Record<string, boolean>,
): SimulationResult {
  const logs: string[] = [];

  const esp32 = components.find((component) => component.type === "esp32");
  const led = components.find((component) => component.type === "led");
  const resistor = components.find(
    (component) => component.type === "resistor",
  );
  const dht22 = components.find((component) => component.type === "dht22");

  if (!esp32) {
    return {
      ledOn: false,
      dht22Connected: false,
      temperature: null,
      humidity: null,
      logs: ["ERROR: ESP32 board not found."],
    };
  }

  logs.push("ESP32 detected.");

  // Build electrical connectivity graph.
  const graph = new Map<PinNode, Set<PinNode>>();

  // Add valid user-created wires. Imported project files can contain stale pin
  // names, so we flag and ignore those connections instead of treating them as
  // invisible electrical shortcuts.
  connections.forEach((connection) => {
    const fromComponent = components.find(
      (component) => component.id === connection.from.componentId,
    );
    const toComponent = components.find(
      (component) => component.id === connection.to.componentId,
    );

    if (!fromComponent || !toComponent) {
      logs.push(`ERROR: Wire ${connection.id} references a component that is no longer in the workspace.`);
      return;
    }

    if (
      !isValidComponentPin(fromComponent.type, connection.from.pinId) ||
      !isValidComponentPin(toComponent.type, connection.to.pinId)
    ) {
      logs.push(`ERROR: Wire ${connection.id} has an invalid pin reference and was ignored.`);
      return;
    }

    addEdge(
      graph,
      getNode(connection.from.componentId, connection.from.pinId),
      getNode(connection.to.componentId, connection.to.pinId),
    );
  });

  // Add internal resistor connectivity.
  if (resistor) {
    addEdge(graph, getNode(resistor.id, "pin1"), getNode(resistor.id, "pin2"));
  }

  // Inputs complete their internal contact only while active. This lets a
  // button or SPDT switch control a normal wire path in the same graph used by
  // the LED and sensor checks below.
  components
    .filter((component) => component.type === "button")
    .forEach((button) => {
      const pressed = getBooleanProperty(button, "pressed", false);
      if (pressed) {
        addEdge(graph, getNode(button.id, "A"), getNode(button.id, "B"));
      }
      logs.push(`${button.name}: ${pressed ? "PRESSED" : "released"}.`);
    });

  components
    .filter((component) => component.type === "switch")
    .forEach((switchComponent) => {
      const isOn = getBooleanProperty(switchComponent, "isOn", false);
      addEdge(
        graph,
        getNode(switchComponent.id, "COM"),
        getNode(switchComponent.id, isOn ? "NO" : "NC"),
      );
      logs.push(
        `${switchComponent.name}: COM connected to ${isOn ? "NO" : "NC"}.`,
      );
    });

  // Add internal breadboard row connectivity.
  const breadboards = components.filter(
    (component) => component.type === "breadboard",
  );

  breadboards.forEach((breadboard) => {
    addBreadboardConnections(graph, breadboard);
  });

  if (breadboards.length > 0) {
    logs.push(`${breadboards.length} breadboard(s) detected.`);
    logs.push("Breadboard internal row connections initialized.");
  }

  // Check LED circuit.
  let ledOn = false;

  if (led && resistor) {
    const positivePath = findPath(
      graph,
      getNode(esp32.id, "GPIO2"),
      getNode(led.id, "anode"),
    );

    const groundPath = findPath(
      graph,
      getNode(led.id, "cathode"),
      getNode(esp32.id, "GND"),
    );

    const pathContainsResistor =
      positivePath?.some((node) => node.startsWith(`${resistor.id}:`)) ?? false;
    const resistance = getNumericProperty(resistor, "resistanceOhms", 220);
    const logicVoltage = getNumericProperty(esp32, "logicVoltage", 3.3);
    const forwardVoltage = getNumericProperty(led, "forwardVoltage", 2);

    const validLedCircuit =
      positivePath !== null &&
      groundPath !== null &&
      pathContainsResistor &&
      resistance > 0;

    if (validLedCircuit) {
      const currentMilliamps = Math.max(
        0,
        ((logicVoltage - forwardVoltage) / resistance) * 1000,
      );
      ledOn = gpioStates.GPIO2 === true && currentMilliamps > 0;

      logs.push(
        `LED circuit connected. GPIO2 is ${gpioStates.GPIO2 ? "HIGH" : "LOW"}.`,
      );
      if (gpioStates.GPIO2 && currentMilliamps > 0) {
        logs.push(`LED current: ${currentMilliamps.toFixed(1)} mA.`);
      }
      logs.push(`LED status: ${ledOn ? "ON" : "OFF"}.`);
    } else if (resistance <= 0) {
      logs.push("ERROR: Resistor resistance must be greater than 0 Ω.");
    } else {
      logs.push(
        "WARNING: LED circuit is incomplete. Check GPIO2, resistor, LED anode and GND connections.",
      );
    }
  } else {
    logs.push("WARNING: LED or resistor not found.");
  }

  // Check DHT22 using graph paths.
  let dht22Connected = false;

  if (dht22) {
    const vccConnected = isConnected(
      graph,
      getNode(esp32.id, "3V3"),
      getNode(dht22.id, "VCC"),
    );

    const dataConnected = isConnected(
      graph,
      getNode(esp32.id, "GPIO4"),
      getNode(dht22.id, "DATA"),
    );

    const groundConnected = isConnected(
      graph,
      getNode(esp32.id, "GND"),
      getNode(dht22.id, "GND"),
    );

    dht22Connected = vccConnected && dataConnected && groundConnected;

    if (dht22Connected) {
      logs.push("DHT22 sensor connected successfully.");
    } else {
      logs.push(
        `WARNING: DHT22 wiring incomplete. VCC: ${vccConnected ? "OK" : "MISSING"}, DATA: ${dataConnected ? "OK" : "MISSING"}, GND: ${groundConnected ? "OK" : "MISSING"}.`,
      );
    }
  }

  // Keep supporting older exported starter projects that used offsets while
  // exposing direct, interactive readings in new projects.
  const temperature = dht22Connected && dht22
    ? getNumericProperty(
        dht22,
        "temperature",
        25.4 + getNumericProperty(dht22, "temperatureOffset", 0),
      )
    : null;
  const humidity = dht22Connected && dht22
    ? getNumericProperty(
        dht22,
        "humidity",
        58.2 + getNumericProperty(dht22, "humidityOffset", 0),
      )
    : null;

  if (temperature !== null && humidity !== null) {
    logs.push(`Temperature: ${temperature.toFixed(1)} °C`);
    logs.push(`Humidity: ${humidity.toFixed(1)} %`);
  }

  return {
    ledOn,
    dht22Connected,
    temperature,
    humidity,
    logs,
  };
}
