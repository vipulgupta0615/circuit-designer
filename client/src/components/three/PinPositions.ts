import type { CircuitComponent } from "@/types/circuit";
import type { Vector3Tuple } from "three";

export function getPinLocalPosition(
  component: CircuitComponent,
  pinId: string,
): Vector3Tuple | null {
  switch (component.type) {
    case "esp32": {
      const pins: Record<string, Vector3Tuple> = {
        GND: [-0.85, 0.24, 0.28],
        "3V3": [-0.49, 0.24, 0.28],
        GPIO2: [-0.13, 0.24, 0.28],
        GPIO4: [0.23, 0.24, 0.28],
        GPIO5: [0.59, 0.24, 0.28],
      };

      return pins[pinId] ?? null;
    }

    case "led": {
      const pins: Record<string, Vector3Tuple> = {
        anode: [-0.04, -0.225, 0],
        cathode: [0.04, -0.225, 0],
      };

      return pins[pinId] ?? null;
    }

    case "resistor": {
      const pins: Record<string, Vector3Tuple> = {
        pin1: [0, 0, -0.3],
        pin2: [0, 0, 0.3],
      };

      return pins[pinId] ?? null;
    }

    case "dht22": {
      const pins: Record<string, Vector3Tuple> = {
        VCC: [-0.16, -0.35, 0],
        DATA: [-0.05, -0.35, 0],
        NC: [0.05, -0.35, 0],
        GND: [0.16, -0.35, 0],
      };

      return pins[pinId] ?? null;
    }

    case "breadboard": {
      // Regular breadboard holes: 20 rows × 8 columns.
      const holeMatch = pinId.match(/^r(\d+)c(\d+)$/);

      if (holeMatch) {
        const row = Number(holeMatch[1]);
        const col = Number(holeMatch[2]);

        if (row < 0 || row >= 20 || col < 0 || col >= 8) {
          return null;
        }

        return [-1.35 + row * 0.14, 0.17, -0.65 + col * 0.18];
      }

      // Positive and negative power rails.
      const railMatch = pinId.match(/^rail_(pos|neg)_(\d+)$/);

      if (railMatch) {
        const rail = railMatch[1];
        const index = Number(railMatch[2]);

        if (index < 0 || index >= 20) {
          return null;
        }

        return [-1.35 + index * 0.14, 0.17, rail === "pos" ? -0.85 : 0.85];
      }

      return null;
    }

    default:
      return null;
  }
}
