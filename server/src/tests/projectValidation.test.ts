import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectPayload } from "../validation/projectValidation";

const component = {
  id: "esp32-1",
  type: "esp32",
  name: "ESP32",
  position: [0, 0, 0],
  rotation: 0,
  properties: { logicVoltage: 3.3 },
};

test("accepts a structurally valid project", () => {
  const result = parseProjectPayload({
    name: "Verified project",
    schemaVersion: 1,
    components: [component],
    connections: [],
    simulationSettings: { gpioStates: { GPIO2: false }, gpioModes: { GPIO2: "OUTPUT" } },
  });
  assert.ok("value" in result);
});

test("rejects dangling connection references", () => {
  const result = parseProjectPayload({
    name: "Bad connection",
    components: [component],
    connections: [{
      id: "wire-1",
      from: { componentId: "esp32-1", pinId: "GPIO2" },
      to: { componentId: "not-present", pinId: "anode" },
      color: "#ef4444",
    }],
  });
  assert.deepEqual(result, { error: "Every connection must reference components in this project." });
});
