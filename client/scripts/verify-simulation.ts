import assert from "node:assert/strict";
import { evaluateCircuit } from "../src/lib/circuitSimulation";
import { createStarterCircuit } from "../src/store/circuitStore";

const starter = createStarterCircuit();
const modes = { GPIO2: "OUTPUT" as const, GPIO4: "INPUT" as const, GPIO5: "INPUT" as const };

const initial = evaluateCircuit(starter.components, starter.connections, { GPIO2: false }, modes);
assert.equal(initial.dht22Connected, true, "starter DHT22 should resolve through the breadboard rails");
assert.equal(initial.ledOn, false, "GPIO2 starts LOW");

const ledHigh = evaluateCircuit(starter.components, starter.connections, { GPIO2: true }, modes);
assert.equal(ledHigh.ledOn, true, "a valid GPIO2/resistor/LED/GND path should light the LED");

const disconnected = evaluateCircuit(
  starter.components,
  starter.connections.filter((connection) => connection.id !== "starter-wire-8"),
  { GPIO2: true },
  modes,
);
assert.equal(disconnected.ledOn, false, "a disconnected LED anode must remain off");
assert.ok(disconnected.diagnostics.some((diagnostic) => diagnostic.code === "LED_CIRCUIT_INCOMPLETE"));

const shorted = evaluateCircuit(
  starter.components,
  [...starter.connections, {
    id: "intentional-short",
    from: { componentId: "starter-esp32", pinId: "3V3" },
    to: { componentId: "starter-esp32", pinId: "GND" },
    color: "#ef4444",
  }],
  { GPIO2: false },
  modes,
);
assert.ok(shorted.diagnostics.some((diagnostic) => diagnostic.code === "POWER_GROUND_SHORT"));

console.log("Simulation verification passed: starter, disconnected LED, and power-to-ground short.");
