import type { CircuitComponent, ComponentType } from "@/types/circuit";
import type { Vector3Tuple } from "three";

type PinLayout = Record<string, Vector3Tuple>;

const arduinoPins: PinLayout = {
  GND: [-1.02, 0.24, 0.42],
  "5V": [-0.76, 0.24, 0.42],
  "3V3": [-0.5, 0.24, 0.42],
  D2: [-1.02, 0.24, -0.42],
  D3: [-0.76, 0.24, -0.42],
  D4: [-0.5, 0.24, -0.42],
  D5: [-0.24, 0.24, -0.42],
  D6: [0.02, 0.24, -0.42],
  D7: [0.28, 0.24, -0.42],
  D8: [0.54, 0.24, -0.42],
  D9: [0.8, 0.24, -0.42],
  D10: [1.06, 0.24, -0.42],
  D11: [-0.24, 0.24, 0.42],
  D12: [0.02, 0.24, 0.42],
  D13: [0.28, 0.24, 0.42],
  A0: [0.7, 0.24, 0.42],
  A1: [1.02, 0.24, 0.42],
};

const staticPinLayouts: Partial<Record<ComponentType, PinLayout>> = {
  esp32: {
    GND: [-0.85, 0.24, 0.28],
    "3V3": [-0.49, 0.24, 0.28],
    GPIO2: [-0.13, 0.24, 0.28],
    GPIO4: [0.23, 0.24, 0.28],
    GPIO5: [0.59, 0.24, 0.28],
  },
  arduino: arduinoPins,
  led: {
    anode: [-0.04, -0.225, 0],
    cathode: [0.04, -0.225, 0],
  },
  rgbLed: {
    R: [-0.12, -0.23, 0],
    G: [-0.04, -0.23, 0],
    B: [0.04, -0.23, 0],
    COM: [0.12, -0.23, 0],
  },
  oled: {
    GND: [-0.33, -0.22, 0],
    VCC: [-0.11, -0.22, 0],
    SCL: [0.11, -0.22, 0],
    SDA: [0.33, -0.22, 0],
  },
  resistor: {
    pin1: [0, 0, -0.3],
    pin2: [0, 0, 0.3],
  },
  capacitor: {
    positive: [-0.07, -0.25, 0],
    negative: [0.07, -0.25, 0],
  },
  button: {
    A: [-0.16, -0.14, 0],
    B: [0.16, -0.14, 0],
  },
  switch: {
    COM: [0, -0.17, 0],
    NO: [-0.18, -0.17, 0],
    NC: [0.18, -0.17, 0],
  },
  servo: {
    VCC: [-0.12, -0.22, 0],
    SIGNAL: [0, -0.22, 0],
    GND: [0.12, -0.22, 0],
  },
  dcMotor: {
    positive: [-0.1, -0.32, 0],
    negative: [0.1, -0.32, 0],
  },
  battery: {
    positive: [-0.17, 0.59, 0],
    negative: [0.17, 0.57, 0],
  },
  powerSupply: {
    VOUT: [-0.28, -0.09, 0.33],
    GND: [0.28, -0.09, 0.33],
  },
  dht22: {
    VCC: [-0.16, -0.35, 0],
    DATA: [-0.05, -0.35, 0],
    NC: [0.05, -0.35, 0],
    GND: [0.16, -0.35, 0],
  },
};

export function getStaticPinPositions(type: ComponentType): PinLayout | null {
  return staticPinLayouts[type] ?? null;
}

export function getPinLocalPosition(
  component: CircuitComponent,
  pinId: string,
): Vector3Tuple | null {
  if (component.type === "breadboard") {
    const holeMatch = pinId.match(/^r(\d+)c(\d+)$/);
    if (!holeMatch) return null;

    const row = Number(holeMatch[1]);
    const col = Number(holeMatch[2]);
    if (row < 0 || row >= 20 || col < 0 || col >= 8) return null;

    return [-1.35 + row * 0.14, 0.17, -0.65 + col * 0.18];
  }

  return staticPinLayouts[component.type]?.[pinId] ?? null;
}
