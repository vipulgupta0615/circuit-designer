export type ComponentType =
  | "esp32"
  | "breadboard"
  | "led"
  | "resistor"
  | "dht22";

export type PinKind =
  | "power"
  | "ground"
  | "signal"
  | "passive"
  | "terminal"
  | "no-connect";

export type GpioMode = "INPUT" | "OUTPUT";

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: [number, number, number];
  rotation: number;
  properties: Record<string, string | number | boolean>;
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

export interface SimulationSettings {
  gpioStates?: Record<string, boolean>;
  gpioModes?: Record<string, GpioMode>;
}
