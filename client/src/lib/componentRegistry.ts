import type {
  CircuitComponent,
  ComponentType,
  PinKind,
} from "@/types/circuit";

export interface PinDefinition {
  id: string;
  label: string;
  kind: PinKind;
  description: string;
}

export interface ComponentDefinition {
  type: ComponentType;
  displayName: string;
  category: string;
  dimensions: [number, number, number];
  pins: PinDefinition[];
  defaultProperties: Record<string, string | number | boolean>;
  specification: string;
}

export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  esp32: {
    type: "esp32",
    displayName: "ESP32 DevKit V1",
    category: "Microcontrollers",
    dimensions: [2.2, 0.24, 0.8],
    pins: [
      { id: "3V3", label: "3V3", kind: "power", description: "3.3 V supply" },
      { id: "GND", label: "GND", kind: "ground", description: "Ground reference" },
      { id: "GPIO2", label: "GPIO2", kind: "signal", description: "Digital GPIO output/input" },
      { id: "GPIO4", label: "GPIO4", kind: "signal", description: "Digital GPIO output/input" },
      { id: "GPIO5", label: "GPIO5", kind: "signal", description: "Digital GPIO output/input" },
    ],
    defaultProperties: { boardModel: "ESP32 DevKit V1", logicVoltage: 3.3 },
    specification: "3.3 V ESP32 development board with simplified GPIO behavior.",
  },
  dht22: {
    type: "dht22",
    displayName: "DHT22 Sensor",
    category: "Sensors",
    dimensions: [0.55, 0.65, 0.35],
    pins: [
      { id: "VCC", label: "VCC", kind: "power", description: "3.3–5 V supply" },
      { id: "DATA", label: "DATA", kind: "signal", description: "Simplified digital data line" },
      { id: "NC", label: "NC", kind: "no-connect", description: "Not connected" },
      { id: "GND", label: "GND", kind: "ground", description: "Ground reference" },
    ],
    defaultProperties: { temperatureC: 25.4, humidityPercent: 58.2, dataGpio: "GPIO4" },
    specification: "Application-level temperature and humidity sensor model; DHT timing is not emulated.",
  },
  led: {
    type: "led",
    displayName: "LED",
    category: "Outputs",
    dimensions: [0.32, 0.45, 0.32],
    pins: [
      { id: "anode", label: "Anode (+)", kind: "passive", description: "Positive LED terminal" },
      { id: "cathode", label: "Cathode (−)", kind: "passive", description: "Negative LED terminal" },
    ],
    defaultProperties: { color: "Red", forwardVoltage: 2 },
    specification: "Digital indicator LED. Requires a series current-limiting resistor.",
  },
  resistor: {
    type: "resistor",
    displayName: "Resistor 220Ω",
    category: "Passive components",
    dimensions: [0.24, 0.45, 0.6],
    pins: [
      { id: "pin1", label: "Terminal 1", kind: "passive", description: "Resistor terminal" },
      { id: "pin2", label: "Terminal 2", kind: "passive", description: "Resistor terminal" },
    ],
    defaultProperties: { resistanceOhms: 220, tolerance: 5 },
    specification: "Current-limiting resistor with an idealized series connection model.",
  },
  breadboard: {
    type: "breadboard",
    displayName: "Solderless Breadboard",
    category: "Prototyping",
    dimensions: [3.2, 0.16, 2],
    pins: [],
    defaultProperties: { rows: 20, columns: 8 },
    specification: "20 rows of split terminal strips plus continuous positive and negative rails.",
  },
};

export function getComponentDefinition(type: ComponentType): ComponentDefinition {
  return componentRegistry[type];
}

export function getPinDefinition(
  component: CircuitComponent,
  pinId: string,
): PinDefinition | null {
  if (component.type !== "breadboard") {
    return componentRegistry[component.type].pins.find((pin) => pin.id === pinId) ?? null;
  }

  if (/^r(?:[0-9]|1[0-9])c[0-7]$/.test(pinId)) {
    return { id: pinId, label: pinId.toUpperCase(), kind: "terminal", description: "Breadboard terminal strip" };
  }

  const rail = pinId.match(/^rail_(pos|neg)_(?:[0-9]|1[0-9])$/);
  if (rail) {
    return {
      id: pinId,
      label: rail[1] === "pos" ? "+ rail" : "− rail",
      kind: rail[1] === "pos" ? "power" : "ground",
      description: "Continuous breadboard power rail",
    };
  }

  return null;
}

export function createComponent(
  type: ComponentType,
  id: string,
  position: [number, number, number],
): CircuitComponent {
  const definition = getComponentDefinition(type);
  return {
    id,
    type,
    name: definition.displayName,
    position,
    rotation: 0,
    properties: { ...definition.defaultProperties },
  };
}
