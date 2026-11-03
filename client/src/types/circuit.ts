export type ComponentType =
  | "esp32"
  | "arduino"
  | "breadboard"
  | "led"
  | "rgbLed"
  | "oled"
  | "resistor"
  | "capacitor"
  | "button"
  | "switch"
  | "servo"
  | "dcMotor"
  | "battery"
  | "powerSupply"
  | "dht22";

export type ComponentProperties = Record<string, string | number | boolean>;

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: [number, number, number];
  rotation: number;
  properties: ComponentProperties;
}

export interface PinReference {
  componentId: string;
  pinId: string;
}

export interface CircuitConnection {
  id: string;
  from: PinReference;
  to: PinReference;
  color: string;
}
