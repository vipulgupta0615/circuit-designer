import type { ComponentProperties, ComponentType } from "@/types/circuit";

export type ComponentCategory =
  | "Microcontrollers"
  | "Sensors"
  | "LEDs & Displays"
  | "Resistors & Capacitors"
  | "Switches & Buttons"
  | "Motors & Actuators"
  | "Power Supplies"
  | "Prototyping";

export interface ComponentPropertyDefinition {
  key: string;
  label: string;
  kind: "text" | "number" | "boolean";
  defaultValue: string | number | boolean;
  unit?: string;
}

export interface ComponentDefinition {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  detail: string;
  pins: string[];
  properties: ComponentPropertyDefinition[];
}

export const componentDefinitions: ComponentDefinition[] = [
  {
    type: "esp32",
    category: "Microcontrollers",
    name: "ESP32 DevKit",
    detail: "Wi-Fi · Bluetooth",
    pins: ["GND", "3V3", "GPIO2", "GPIO4", "GPIO5"],
    properties: [
      { key: "boardModel", label: "Board model", kind: "text", defaultValue: "ESP32 DevKit V1" },
      { key: "logicVoltage", label: "Logic voltage", kind: "number", defaultValue: 3.3, unit: "V" },
      { key: "gpioConfiguration", label: "GPIO configuration", kind: "text", defaultValue: "GPIO2, GPIO4, GPIO5" },
    ],
  },
  {
    type: "arduino",
    category: "Microcontrollers",
    name: "Arduino Uno",
    detail: "5V · ATmega328P",
    pins: ["GND", "5V", "3V3", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "A0", "A1"],
    properties: [
      { key: "boardModel", label: "Board model", kind: "text", defaultValue: "Arduino Uno R3" },
      { key: "logicVoltage", label: "Logic voltage", kind: "number", defaultValue: 5, unit: "V" },
      { key: "clockSpeed", label: "Clock speed", kind: "number", defaultValue: 16, unit: "MHz" },
    ],
  },
  {
    type: "dht22",
    category: "Sensors",
    name: "DHT22 Sensor",
    detail: "Temperature · humidity",
    pins: ["VCC", "DATA", "NC", "GND"],
    properties: [
      { key: "samplingIntervalMs", label: "Sampling interval", kind: "number", defaultValue: 2000, unit: "ms" },
      { key: "temperature", label: "Simulated temperature", kind: "number", defaultValue: 25.4, unit: "°C" },
      { key: "humidity", label: "Simulated humidity", kind: "number", defaultValue: 58.2, unit: "%" },
    ],
  },
  {
    type: "led",
    category: "LEDs & Displays",
    name: "LED",
    detail: "Single colour · 5 mm",
    pins: ["anode", "cathode"],
    properties: [
      { key: "color", label: "LED colour", kind: "text", defaultValue: "Red" },
      { key: "forwardVoltage", label: "Forward voltage", kind: "number", defaultValue: 2, unit: "V" },
    ],
  },
  {
    type: "rgbLed",
    category: "LEDs & Displays",
    name: "RGB LED",
    detail: "Red · green · blue",
    pins: ["R", "G", "B", "COM"],
    properties: [
      { key: "commonType", label: "Common terminal", kind: "text", defaultValue: "Common cathode" },
      { key: "brightness", label: "Brightness", kind: "number", defaultValue: 100, unit: "%" },
    ],
  },
  {
    type: "oled",
    category: "LEDs & Displays",
    name: "OLED Display",
    detail: "128×64 · I²C",
    pins: ["GND", "VCC", "SCL", "SDA"],
    properties: [
      { key: "driver", label: "Driver", kind: "text", defaultValue: "SSD1306" },
      { key: "resolution", label: "Resolution", kind: "text", defaultValue: "128 × 64" },
      { key: "address", label: "I²C address", kind: "text", defaultValue: "0x3C" },
    ],
  },
  {
    type: "resistor",
    category: "Resistors & Capacitors",
    name: "Resistor 220Ω",
    detail: "Current limiting",
    pins: ["pin1", "pin2"],
    properties: [
      { key: "resistanceOhms", label: "Resistance", kind: "number", defaultValue: 220, unit: "Ω" },
      { key: "tolerance", label: "Tolerance", kind: "number", defaultValue: 5, unit: "%" },
    ],
  },
  {
    type: "capacitor",
    category: "Resistors & Capacitors",
    name: "Capacitor",
    detail: "Electrolytic · 100 µF",
    pins: ["positive", "negative"],
    properties: [
      { key: "capacitance", label: "Capacitance", kind: "number", defaultValue: 100, unit: "µF" },
      { key: "voltageRating", label: "Voltage rating", kind: "number", defaultValue: 16, unit: "V" },
    ],
  },
  {
    type: "button",
    category: "Switches & Buttons",
    name: "Push Button",
    detail: "Momentary · normally open",
    pins: ["A", "B"],
    properties: [
      { key: "buttonType", label: "Button type", kind: "text", defaultValue: "Momentary normally open" },
      { key: "pressed", label: "Press button", kind: "boolean", defaultValue: false },
      { key: "debounceMs", label: "Debounce", kind: "number", defaultValue: 20, unit: "ms" },
    ],
  },
  {
    type: "switch",
    category: "Switches & Buttons",
    name: "Toggle Switch",
    detail: "SPDT · 3 terminals",
    pins: ["COM", "NO", "NC"],
    properties: [
      { key: "switchType", label: "Switch type", kind: "text", defaultValue: "SPDT" },
      { key: "isOn", label: "Connect COM to NO", kind: "boolean", defaultValue: false },
    ],
  },
  {
    type: "servo",
    category: "Motors & Actuators",
    name: "Micro Servo",
    detail: "0–180° · PWM",
    pins: ["VCC", "SIGNAL", "GND"],
    properties: [
      { key: "rangeDegrees", label: "Range", kind: "number", defaultValue: 180, unit: "°" },
      { key: "torque", label: "Torque", kind: "number", defaultValue: 1.8, unit: "kg·cm" },
    ],
  },
  {
    type: "dcMotor",
    category: "Motors & Actuators",
    name: "DC Motor",
    detail: "3–6 V · brushed",
    pins: ["positive", "negative"],
    properties: [
      { key: "nominalVoltage", label: "Nominal voltage", kind: "number", defaultValue: 5, unit: "V" },
      { key: "rpm", label: "No-load speed", kind: "number", defaultValue: 12000, unit: "RPM" },
    ],
  },
  {
    type: "battery",
    category: "Power Supplies",
    name: "9V Battery",
    detail: "Portable DC source",
    pins: ["positive", "negative"],
    properties: [
      { key: "voltage", label: "Voltage", kind: "number", defaultValue: 9, unit: "V" },
      { key: "capacity", label: "Capacity", kind: "number", defaultValue: 500, unit: "mAh" },
    ],
  },
  {
    type: "powerSupply",
    category: "Power Supplies",
    name: "Bench Power Supply",
    detail: "Adjustable DC output",
    pins: ["VOUT", "GND"],
    properties: [
      { key: "voltage", label: "Output voltage", kind: "number", defaultValue: 5, unit: "V" },
      { key: "currentLimit", label: "Current limit", kind: "number", defaultValue: 1, unit: "A" },
    ],
  },
  {
    type: "breadboard",
    category: "Prototyping",
    name: "Breadboard",
    detail: "160 interactive holes",
    pins: ["r0c0–r19c7"],
    properties: [],
  },
];

export const componentCategories: ComponentCategory[] = [
  "Microcontrollers",
  "Sensors",
  "LEDs & Displays",
  "Resistors & Capacitors",
  "Switches & Buttons",
  "Motors & Actuators",
  "Power Supplies",
  "Prototyping",
];

const definitionsByType = new Map(
  componentDefinitions.map((definition) => [definition.type, definition]),
);

export function getComponentDefinition(type: ComponentType): ComponentDefinition {
  const definition = definitionsByType.get(type);
  if (!definition) throw new Error(`Unknown component type: ${type}`);
  return definition;
}

export function isComponentType(value: unknown): value is ComponentType {
  return typeof value === "string" && definitionsByType.has(value as ComponentType);
}

export function getDefaultProperties(type: ComponentType): ComponentProperties {
  return Object.fromEntries(
    getComponentDefinition(type).properties.map((property) => [
      property.key,
      property.defaultValue,
    ]),
  );
}

export function isValidComponentPin(type: ComponentType, pinId: string): boolean {
  if (type === "breadboard") {
    const match = pinId.match(/^r(\d+)c(\d+)$/);
    if (!match) return false;

    const row = Number(match[1]);
    const column = Number(match[2]);
    return row >= 0 && row < 20 && column >= 0 && column < 8;
  }

  return getComponentDefinition(type).pins.includes(pinId);
}
