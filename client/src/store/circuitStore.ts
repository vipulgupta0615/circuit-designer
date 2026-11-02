import { create } from "zustand";
import { evaluateCircuit } from "@/lib/circuitSimulation";

import type {
  CircuitComponent,
  CircuitConnection,
  ComponentType,
  PinReference,
} from "@/types/circuit";

type ComponentProperties = Record<string, string | number | boolean>;

interface CircuitState {
  components: CircuitComponent[];
  connections: CircuitConnection[];
  projectId: string | null;
  projectName: string;
  pendingPin: PinReference | null;
  selectedComponentId: string | null;

  // Simulation state
  isRunning: boolean;
  gpioStates: Record<string, boolean>;
  ledOn: boolean;
  dht22Connected: boolean;
  temperature: number | null;
  humidity: number | null;
  simulationLogs: string[];

  // Component actions
  addComponent: (type: ComponentType) => void;
  setCircuit: (
    project: {
      id?: string | null;
      name: string;
      components: CircuitComponent[];
      connections: CircuitConnection[];
    },
  ) => void;
  resetWorkspace: () => void;
  setProjectName: (name: string) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentName: (id: string, name: string) => void;
  updateComponentProperties: (
    id: string,
    properties: ComponentProperties,
  ) => void;
  updatePosition: (id: string, position: [number, number, number]) => void;
  updateRotation: (id: string, rotation: number) => void;

  // Connection actions
  addConnection: (from: PinReference, to: PinReference) => void;
  removeConnection: (id: string) => void;
  selectPin: (pin: PinReference) => void;
  cancelPinSelection: () => void;

  // Simulation actions
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setGpioState: (pin: string, value: boolean) => void;
}

function getDefaultComponentName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    esp32: "ESP32 DevKit V1",
    breadboard: "Breadboard",
    led: "LED",
    resistor: "Resistor 220Ω",
    dht22: "DHT22 Sensor",
  };

  return names[type];
}

function createStarterCircuit() {
  const components: CircuitComponent[] = [
    {
      id: "starter-esp32",
      type: "esp32",
      name: "ESP32 DevKit V1",
      position: [-2.65, 0.2, 0],
      rotation: 0,
      properties: {},
    },
    {
      id: "starter-dht22",
      type: "dht22",
      name: "DHT22 Sensor",
      position: [1.8, 0.45, -1.15],
      rotation: 0,
      properties: {},
    },
    {
      id: "starter-led",
      type: "led",
      name: "Status LED",
      position: [1.45, 0.25, 1.15],
      rotation: 0,
      properties: {},
    },
    {
      id: "starter-resistor",
      type: "resistor",
      name: "220Ω Resistor",
      position: [0.55, 0.25, 1.25],
      rotation: Math.PI / 2,
      properties: {},
    },
    {
      id: "starter-breadboard",
      type: "breadboard",
      name: "Solderless Breadboard",
      position: [0.15, -0.02, 0],
      rotation: 0,
      properties: {},
    },
  ];

  const connect = (
    id: string,
    fromComponentId: string,
    fromPinId: string,
    toComponentId: string,
    toPinId: string,
    color: string,
  ): CircuitConnection => ({
    id,
    from: { componentId: fromComponentId, pinId: fromPinId },
    to: { componentId: toComponentId, pinId: toPinId },
    color,
  });

  const connections = [
    connect("starter-wire-1", "starter-esp32", "3V3", "starter-dht22", "VCC", "#f97316"),
    connect("starter-wire-2", "starter-esp32", "GPIO4", "starter-dht22", "DATA", "#22c55e"),
    connect("starter-wire-3", "starter-esp32", "GND", "starter-dht22", "GND", "#64748b"),
    connect("starter-wire-4", "starter-esp32", "GPIO2", "starter-resistor", "pin1", "#ef4444"),
    connect("starter-wire-5", "starter-resistor", "pin2", "starter-led", "anode", "#ef4444"),
    connect("starter-wire-6", "starter-led", "cathode", "starter-esp32", "GND", "#64748b"),
  ];

  return { components, connections };
}

const starterCircuit = createStarterCircuit();

export const useCircuitStore = create<CircuitState>((set, get) => ({
  // Initial component state
  components: starterCircuit.components,
  connections: starterCircuit.connections,
  projectId: null,
  projectName: "ESP32 Smart Home Monitoring System",
  pendingPin: null,
  selectedComponentId: null,

  // Initial simulation state
  isRunning: false,

  gpioStates: {
    GPIO2: false,
    GPIO4: false,
    GPIO5: false,
  },

  ledOn: false,
  dht22Connected: false,
  temperature: null,
  humidity: null,
  simulationLogs: [],

  // =====================================
  // COMPONENT MANAGEMENT
  // =====================================

  addComponent: (type) =>
    set((state) => {
      const component: CircuitComponent = {
        id: crypto.randomUUID(),
        type,
        name: getDefaultComponentName(type),
        position: [
          state.components.length % 2 === 0 ? -2.8 : 2.8,
          0.2,
          (Math.floor(state.components.length / 2) - 1) * 2.5,
        ],
        rotation: 0,
        properties: {},
      };

      const components = [...state.components, component];
      const nextState = {
        components,
        selectedComponentId: component.id,
      };

      if (!state.isRunning) return nextState;

      const result = evaluateCircuit(components, state.connections, state.gpioStates);
      return {
        ...nextState,
        ledOn: result.ledOn,
        dht22Connected: result.dht22Connected,
        temperature: result.temperature,
        humidity: result.humidity,
        simulationLogs: [...state.simulationLogs, "Component added.", ...result.logs],
      };
    }),

  setCircuit: (project) =>
    set({
      components: project.components,
      connections: project.connections,
      projectId: project.id ?? null,
      projectName: project.name,
      pendingPin: null,
      selectedComponentId: null,
      isRunning: false,
      ledOn: false,
      dht22Connected: false,
      temperature: null,
      humidity: null,
      simulationLogs: [],
    }),

  resetWorkspace: () => {
    const starter = createStarterCircuit();
    set({
      components: starter.components,
      connections: starter.connections,
      projectId: null,
      projectName: "ESP32 Smart Home Monitoring System",
      pendingPin: null,
      selectedComponentId: null,
      isRunning: false,
      gpioStates: {
        GPIO2: false,
        GPIO4: false,
        GPIO5: false,
      },
      ledOn: false,
      dht22Connected: false,
      temperature: null,
      humidity: null,
      simulationLogs: [],
    });
  },

  setProjectName: (projectName) => set({ projectName }),

  removeComponent: (id) =>
    set((state) => {
      const components = state.components.filter((component) => component.id !== id);
      const connections = state.connections.filter(
        (connection) =>
          connection.from.componentId !== id &&
          connection.to.componentId !== id,
      );

      const nextState = {
        components,
        connections,
        pendingPin:
          state.pendingPin?.componentId === id ? null : state.pendingPin,
        selectedComponentId:
          state.selectedComponentId === id ? null : state.selectedComponentId,
      };

      if (!state.isRunning) return nextState;

      const result = evaluateCircuit(components, connections, state.gpioStates);
      return {
        ...nextState,
        ledOn: result.ledOn,
        dht22Connected: result.dht22Connected,
        temperature: result.temperature,
        humidity: result.humidity,
        simulationLogs: [...state.simulationLogs, "Component removed.", ...result.logs],
      };
    }),

  selectComponent: (id) => set({ selectedComponentId: id }),

  // Update component name
  updateComponentName: (id, name) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, name } : component,
      ),
    })),

  // Update component properties
  updateComponentProperties: (id, properties) =>
    set((state) => {
      const components = state.components.map((component) =>
        component.id === id
          ? {
              ...component,
              properties: {
                ...component.properties,
                ...properties,
              },
            }
          : component,
      );

      if (!state.isRunning) {
        return { components };
      }

      const result = evaluateCircuit(
        components,
        state.connections,
        state.gpioStates,
      );

      return {
        components,
        ledOn: result.ledOn,
        dht22Connected: result.dht22Connected,
        temperature: result.temperature,
        humidity: result.humidity,
      };
    }),

  updatePosition: (id, position) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, position } : component,
      ),
    })),

  updateRotation: (id, rotation) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, rotation } : component,
      ),
    })),

  // =====================================
  // CONNECTION MANAGEMENT
  // =====================================

  addConnection: (from, to) =>
    set((state) => {
      if (from.componentId === to.componentId && from.pinId === to.pinId) {
        return state;
      }

      const fromExists = state.components.some(
        (component) => component.id === from.componentId,
      );

      const toExists = state.components.some(
        (component) => component.id === to.componentId,
      );

      if (!fromExists || !toExists) {
        return state;
      }

      const alreadyConnected = state.connections.some(
        (connection) =>
          (connection.from.componentId === from.componentId &&
            connection.from.pinId === from.pinId &&
            connection.to.componentId === to.componentId &&
            connection.to.pinId === to.pinId) ||
          (connection.from.componentId === to.componentId &&
            connection.from.pinId === to.pinId &&
            connection.to.componentId === from.componentId &&
            connection.to.pinId === from.pinId),
      );

      if (alreadyConnected) {
        return state;
      }

      const newConnection: CircuitConnection = {
        id: crypto.randomUUID(),
        from,
        to,
        color: "#ef4444",
      };

      const connections = [...state.connections, newConnection];

      if (!state.isRunning) {
        return { connections };
      }

      const result = evaluateCircuit(
        state.components,
        connections,
        state.gpioStates,
      );

      return {
        connections,
        ledOn: result.ledOn,
        dht22Connected: result.dht22Connected,
        temperature: result.temperature,
        humidity: result.humidity,
        simulationLogs: [
          ...state.simulationLogs,
          "New circuit connection added.",
          ...result.logs,
        ],
      };
    }),

  removeConnection: (id) =>
    set((state) => {
      const connections = state.connections.filter(
        (connection) => connection.id !== id,
      );

      if (!state.isRunning) {
        return { connections };
      }

      const result = evaluateCircuit(
        state.components,
        connections,
        state.gpioStates,
      );

      return {
        connections,
        ledOn: result.ledOn,
        dht22Connected: result.dht22Connected,
        temperature: result.temperature,
        humidity: result.humidity,
        simulationLogs: [
          ...state.simulationLogs,
          "Circuit connection removed.",
          ...result.logs,
        ],
      };
    }),

  // Two-click pin selection
  selectPin: (pin) => {
    const pendingPin = get().pendingPin;

    if (!pendingPin) {
      set({ pendingPin: pin });
      return;
    }

    if (
      pendingPin.componentId === pin.componentId &&
      pendingPin.pinId === pin.pinId
    ) {
      set({ pendingPin: null });
      return;
    }

    get().addConnection(pendingPin, pin);
    set({ pendingPin: null });
  },

  cancelPinSelection: () => set({ pendingPin: null }),

  // =====================================
  // SIMULATION ENGINE
  // =====================================

  startSimulation: () => {
    const state = get();

    const result = evaluateCircuit(
      state.components,
      state.connections,
      state.gpioStates,
    );

    set({
      isRunning: true,
      ledOn: result.ledOn,
      dht22Connected: result.dht22Connected,
      temperature: result.temperature,
      humidity: result.humidity,
      simulationLogs: ["Simulation started.", ...result.logs],
    });
  },

  stopSimulation: () =>
    set((state) => ({
      isRunning: false,
      ledOn: false,
      simulationLogs: [...state.simulationLogs, "Simulation stopped."],
    })),

  resetSimulation: () =>
    set({
      isRunning: false,

      gpioStates: {
        GPIO2: false,
        GPIO4: false,
        GPIO5: false,
      },

      ledOn: false,
      dht22Connected: false,
      temperature: null,
      humidity: null,

      simulationLogs: ["Simulation reset."],
    }),

  setGpioState: (pin, value) => {
    const state = get();

    const gpioStates = {
      ...state.gpioStates,
      [pin]: value,
    };

    if (!state.isRunning) {
      set({ gpioStates });
      return;
    }

    const result = evaluateCircuit(
      state.components,
      state.connections,
      gpioStates,
    );

    set({
      gpioStates,
      ledOn: result.ledOn,
      dht22Connected: result.dht22Connected,
      temperature: result.temperature,
      humidity: result.humidity,

      simulationLogs: [
        ...state.simulationLogs,
        `${pin} set to ${value ? "HIGH" : "LOW"}.`,
        ...result.logs,
      ],
    });
  },
}));
