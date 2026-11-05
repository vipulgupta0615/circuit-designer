import { create } from "zustand";
import { evaluateCircuit } from "@/lib/circuitSimulation";
import { createComponent } from "@/lib/componentRegistry";
import { canUsePin, validateNewConnection, type SimulationDiagnostic } from "@/engine/connectionValidator";
import type {
  CircuitComponent,
  CircuitConnection,
  ComponentType,
  GpioMode,
  PinReference,
  SimulationSettings,
} from "@/types/circuit";

type ComponentProperties = Record<string, string | number | boolean>;

interface ProjectCircuit {
  id?: string | null;
  name: string;
  components: CircuitComponent[];
  connections: CircuitConnection[];
  simulationSettings?: SimulationSettings;
}

interface CircuitState {
  components: CircuitComponent[];
  connections: CircuitConnection[];
  projectId: string | null;
  projectName: string;
  pendingPin: PinReference | null;
  selectedComponentId: string | null;
  isReadOnly: boolean;
  connectionFeedback: string | null;
  isRunning: boolean;
  gpioStates: Record<string, boolean>;
  gpioModes: Record<string, GpioMode>;
  ledOn: boolean;
  dht22Connected: boolean;
  temperature: number | null;
  humidity: number | null;
  diagnostics: SimulationDiagnostic[];
  simulationLogs: string[];
  addComponent: (type: ComponentType) => void;
  setCircuit: (project: ProjectCircuit, readOnly?: boolean) => void;
  resetWorkspace: () => void;
  forkSharedProject: () => void;
  setProjectName: (name: string) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentName: (id: string, name: string) => void;
  updateComponentProperties: (id: string, properties: ComponentProperties) => void;
  updatePosition: (id: string, position: [number, number, number]) => void;
  updateRotation: (id: string, rotation: number) => void;
  addConnection: (from: PinReference, to: PinReference) => void;
  removeConnection: (id: string) => void;
  selectPin: (pin: PinReference) => void;
  cancelPinSelection: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setGpioState: (pin: string, value: boolean) => void;
  setGpioMode: (pin: string, mode: GpioMode) => void;
  setDht22Environment: (temperatureC: number, humidityPercent: number) => void;
}

const defaultGpioStates = { GPIO2: false, GPIO4: false, GPIO5: false };
const defaultGpioModes: Record<string, GpioMode> = {
  GPIO2: "OUTPUT",
  GPIO4: "INPUT",
  GPIO5: "INPUT",
};

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `component-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createStarterCircuit() {
  const esp32 = createComponent("esp32", "starter-esp32", [-2.65, 0.2, 0]);
  const dht22 = createComponent("dht22", "starter-dht22", [1.8, 0.45, -1.15]);
  const led = createComponent("led", "starter-led", [1.45, 0.25, 1.15]);
  const resistor = createComponent("resistor", "starter-resistor", [0.55, 0.25, 1.25]);
  resistor.rotation = Math.PI / 2;
  const breadboard = createComponent("breadboard", "starter-breadboard", [0.15, -0.02, 0]);
  breadboard.name = "Solderless Breadboard";
  led.name = "Status LED";
  resistor.name = "220Ω Resistor";

  const wire = (id: string, fromComponentId: string, fromPinId: string, toComponentId: string, toPinId: string, color: string): CircuitConnection => ({
    id,
    from: { componentId: fromComponentId, pinId: fromPinId },
    to: { componentId: toComponentId, pinId: toPinId },
    color,
  });

  return {
    components: [esp32, dht22, led, resistor, breadboard],
    connections: [
      wire("starter-wire-1", esp32.id, "3V3", breadboard.id, "rail_pos_0", "#f97316"),
      wire("starter-wire-2", breadboard.id, "rail_pos_14", dht22.id, "VCC", "#f97316"),
      wire("starter-wire-3", esp32.id, "GPIO4", dht22.id, "DATA", "#22c55e"),
      wire("starter-wire-4", esp32.id, "GND", breadboard.id, "rail_neg_0", "#64748b"),
      wire("starter-wire-5", breadboard.id, "rail_neg_14", dht22.id, "GND", "#64748b"),
      wire("starter-wire-6", esp32.id, "GPIO2", resistor.id, "pin1", "#ef4444"),
      wire("starter-wire-7", resistor.id, "pin2", breadboard.id, "r10c0", "#ef4444"),
      wire("starter-wire-8", breadboard.id, "r10c3", led.id, "anode", "#ef4444"),
      wire("starter-wire-9", led.id, "cathode", breadboard.id, "r11c4", "#64748b"),
      wire("starter-wire-10", breadboard.id, "r11c7", esp32.id, "GND", "#64748b"),
    ],
  };
}

const starterCircuit = createStarterCircuit();
const initialResult = evaluateCircuit(starterCircuit.components, starterCircuit.connections, defaultGpioStates, defaultGpioModes);

function normalizedSettings(settings?: SimulationSettings) {
  const gpioStates = { ...defaultGpioStates, ...settings?.gpioStates };
  const gpioModes: Record<string, GpioMode> = { ...defaultGpioModes };
  for (const [pin, mode] of Object.entries(settings?.gpioModes ?? {})) {
    if (mode === "INPUT" || mode === "OUTPUT") gpioModes[pin] = mode;
  }
  return { gpioStates, gpioModes };
}

function evaluateDiagnostics(state: Pick<CircuitState, "components" | "connections" | "gpioStates" | "gpioModes">) {
  return evaluateCircuit(state.components, state.connections, state.gpioStates, state.gpioModes);
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  components: starterCircuit.components,
  connections: starterCircuit.connections,
  projectId: null,
  projectName: "ESP32 Smart Home Monitoring System",
  pendingPin: null,
  selectedComponentId: null,
  isReadOnly: false,
  connectionFeedback: null,
  isRunning: false,
  gpioStates: defaultGpioStates,
  gpioModes: defaultGpioModes,
  ledOn: false,
  dht22Connected: false,
  temperature: null,
  humidity: null,
  diagnostics: initialResult.diagnostics,
  simulationLogs: [],

  addComponent: (type) => set((state) => {
    if (state.isReadOnly) return state;
    const component = createComponent(type, newId(), [state.components.length % 2 === 0 ? -2.8 : 2.8, 0.2, (Math.floor(state.components.length / 2) - 1) * 2.5]);
    const components = [...state.components, component];
    const result = evaluateDiagnostics({ ...state, components });
    return {
      components,
      selectedComponentId: component.id,
      diagnostics: result.diagnostics,
      connectionFeedback: null,
      ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, "[INFO] Component added.", ...result.logs] } : {}),
    };
  }),

  setCircuit: (project, readOnly = false) => set(() => {
    const { gpioStates, gpioModes } = normalizedSettings(project.simulationSettings);
    const result = evaluateCircuit(project.components, project.connections, gpioStates, gpioModes);
    return { components: project.components, connections: project.connections, projectId: project.id ?? null, projectName: project.name, pendingPin: null, selectedComponentId: null, isReadOnly: readOnly, connectionFeedback: null, isRunning: false, gpioStates, gpioModes, ledOn: false, dht22Connected: false, temperature: null, humidity: null, diagnostics: result.diagnostics, simulationLogs: [] };
  }),

  resetWorkspace: () => {
    const starter = createStarterCircuit();
    const result = evaluateCircuit(starter.components, starter.connections, defaultGpioStates, defaultGpioModes);
    set({ components: starter.components, connections: starter.connections, projectId: null, projectName: "ESP32 Smart Home Monitoring System", pendingPin: null, selectedComponentId: null, isReadOnly: false, connectionFeedback: null, isRunning: false, gpioStates: { ...defaultGpioStates }, gpioModes: { ...defaultGpioModes }, ledOn: false, dht22Connected: false, temperature: null, humidity: null, diagnostics: result.diagnostics, simulationLogs: [] });
  },

  forkSharedProject: () => set((state) => ({ projectId: null, projectName: `${state.projectName} (copy)`, isReadOnly: false, connectionFeedback: "Editable copy created. Save it to your project library when ready." })),
  setProjectName: (projectName) => set((state) => state.isReadOnly ? state : { projectName }),
  selectComponent: (id) => set({ selectedComponentId: id }),

  removeComponent: (id) => set((state) => {
    if (state.isReadOnly) return state;
    const components = state.components.filter((component) => component.id !== id);
    const connections = state.connections.filter((connection) => connection.from.componentId !== id && connection.to.componentId !== id);
    const result = evaluateDiagnostics({ ...state, components, connections });
    return { components, connections, pendingPin: state.pendingPin?.componentId === id ? null : state.pendingPin, selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId, diagnostics: result.diagnostics, ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, "[INFO] Component removed.", ...result.logs] } : {}) };
  }),

  updateComponentName: (id, name) => set((state) => state.isReadOnly ? state : { components: state.components.map((component) => component.id === id ? { ...component, name } : component) }),
  updateComponentProperties: (id, properties) => set((state) => {
    if (state.isReadOnly) return state;
    const components = state.components.map((component) => component.id === id ? { ...component, properties: { ...component.properties, ...properties } } : component);
    const result = evaluateDiagnostics({ ...state, components });
    return { components, diagnostics: result.diagnostics, ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity } : {}) };
  }),
  updatePosition: (id, position) => set((state) => state.isReadOnly ? state : { components: state.components.map((component) => component.id === id ? { ...component, position } : component) }),
  updateRotation: (id, rotation) => set((state) => state.isReadOnly ? state : { components: state.components.map((component) => component.id === id ? { ...component, rotation } : component) }),

  addConnection: (from, to) => set((state) => {
    if (state.isReadOnly) return state;
    const invalidReason = validateNewConnection(state.components, from, to);
    if (invalidReason) return { connectionFeedback: invalidReason };
    const duplicate = state.connections.some((connection) => (connection.from.componentId === from.componentId && connection.from.pinId === from.pinId && connection.to.componentId === to.componentId && connection.to.pinId === to.pinId) || (connection.from.componentId === to.componentId && connection.from.pinId === to.pinId && connection.to.componentId === from.componentId && connection.to.pinId === from.pinId));
    if (duplicate) return { connectionFeedback: "These pins are already connected." };
    const connections = [...state.connections, { id: newId(), from, to, color: "#ef4444" }];
    const result = evaluateDiagnostics({ ...state, connections });
    return { connections, diagnostics: result.diagnostics, connectionFeedback: result.diagnostics.some((item) => item.severity === "error") ? "Wire added, but circuit validation found an error." : "Wire connected.", ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, "[INFO] New circuit connection added.", ...result.logs] } : {}) };
  }),

  removeConnection: (id) => set((state) => {
    if (state.isReadOnly) return state;
    const connections = state.connections.filter((connection) => connection.id !== id);
    const result = evaluateDiagnostics({ ...state, connections });
    return { connections, diagnostics: result.diagnostics, connectionFeedback: "Wire removed.", ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, "[INFO] Circuit connection removed.", ...result.logs] } : {}) };
  }),

  selectPin: (pin) => {
    const state = get();
    if (state.isReadOnly) return;
    if (!state.pendingPin) {
      const component = state.components.find((item) => item.id === pin.componentId);
      if (!canUsePin(component, pin.pinId)) {
        set({ connectionFeedback: "This pin is unavailable for a connection." });
        return;
      }
      set({ pendingPin: pin, connectionFeedback: "Choose a second pin to complete the wire." });
      return;
    }
    if (state.pendingPin.componentId === pin.componentId && state.pendingPin.pinId === pin.pinId) {
      set({ pendingPin: null, connectionFeedback: "Wire creation cancelled." });
      return;
    }
    get().addConnection(state.pendingPin, pin);
    set({ pendingPin: null });
  },
  cancelPinSelection: () => set({ pendingPin: null, connectionFeedback: null }),

  startSimulation: () => {
    const state = get();
    if (state.isReadOnly) return;
    const result = evaluateDiagnostics(state);
    set({ isRunning: true, ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, diagnostics: result.diagnostics, simulationLogs: ["[INFO] Simulation started.", ...result.logs] });
  },
  stopSimulation: () => set((state) => ({ isRunning: false, ledOn: false, simulationLogs: [...state.simulationLogs, "[INFO] Simulation stopped."] })),
  resetSimulation: () => set((state) => ({ isRunning: false, gpioStates: { ...defaultGpioStates }, gpioModes: { ...defaultGpioModes }, ledOn: false, dht22Connected: false, temperature: null, humidity: null, diagnostics: evaluateCircuit(state.components, state.connections, defaultGpioStates, defaultGpioModes).diagnostics, simulationLogs: ["[INFO] Simulation reset."] })),

  setGpioState: (pin, value) => {
    const state = get();
    if (state.isReadOnly) return;
    const gpioStates = { ...state.gpioStates, [pin]: value };
    const result = evaluateCircuit(state.components, state.connections, gpioStates, state.gpioModes);
    set({ gpioStates, diagnostics: result.diagnostics, ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, `[INFO] ${pin} set to ${value ? "HIGH" : "LOW"}.`, ...result.logs] } : {}) });
  },
  setGpioMode: (pin, mode) => {
    const state = get();
    if (state.isReadOnly) return;
    const gpioModes = { ...state.gpioModes, [pin]: mode };
    const result = evaluateCircuit(state.components, state.connections, state.gpioStates, gpioModes);
    set({ gpioModes, diagnostics: result.diagnostics, ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, `[INFO] ${pin} configured as ${mode}.`, ...result.logs] } : {}) });
  },
  setDht22Environment: (temperatureC, humidityPercent) => {
    const state = get();
    if (state.isReadOnly) return;
    const dht22 = state.components.find((component) => component.type === "dht22");
    if (!dht22) return;
    const components = state.components.map((component) => component.id === dht22.id ? { ...component, properties: { ...component.properties, temperatureC, humidityPercent } } : component);
    const result = evaluateCircuit(components, state.connections, state.gpioStates, state.gpioModes);
    set({ components, diagnostics: result.diagnostics, ...(state.isRunning ? { ledOn: result.ledOn, dht22Connected: result.dht22Connected, temperature: result.temperature, humidity: result.humidity, simulationLogs: [...state.simulationLogs, "[INFO] DHT22 environmental values updated.", ...result.logs] } : {}) });
  },
}));
