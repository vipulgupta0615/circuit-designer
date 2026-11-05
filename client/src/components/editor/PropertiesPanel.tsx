"use client";

import { useState } from "react";
import { useCircuitStore } from "@/store/circuitStore";
import { getComponentDefinition } from "@/lib/componentRegistry";
import { Cable, Trash2, RotateCw, Settings2 } from "lucide-react";
import type { CircuitComponent } from "@/types/circuit";

interface ConnectablePin {
  id: string;
  label: string;
}

function getConnectablePins(component: CircuitComponent): ConnectablePin[] {
  if (component.type !== "breadboard") {
    return getComponentDefinition(component.type).pins
      .filter((pin) => pin.kind !== "no-connect")
      .map((pin) => ({ id: pin.id, label: pin.label }));
  }

  const railPins = (rail: "pos" | "neg", label: string) =>
    Array.from({ length: 20 }, (_, index) => ({
      id: `rail_${rail}_${index}`,
      label: `${label} rail · point ${index + 1}`,
    }));

  const terminalPins = Array.from({ length: 20 }, (_, row) =>
    Array.from({ length: 8 }, (_, column) => ({
      id: `r${row}c${column}`,
      label: `Row ${row + 1} · ${column < 4 ? "left" : "right"} strip · hole ${(column % 4) + 1}`,
    })),
  ).flat();

  return [
    ...railPins("pos", "Positive (+)"),
    ...railPins("neg", "Negative (−)"),
    ...terminalPins,
  ];
}

export default function PropertiesPanel() {
  const components = useCircuitStore((state) => state.components);
  const selectedId = useCircuitStore((state) => state.selectedComponentId);
  const connections = useCircuitStore((state) => state.connections);
  const addConnection = useCircuitStore((state) => state.addConnection);
  const connectionFeedback = useCircuitStore((state) => state.connectionFeedback);

  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const updatePosition = useCircuitStore((state) => state.updatePosition);
  const updateRotation = useCircuitStore((state) => state.updateRotation);
  const updateComponentName = useCircuitStore(
    (state) => state.updateComponentName,
  );
  const updateComponentProperties = useCircuitStore(
    (state) => state.updateComponentProperties,
  );
  const isReadOnly = useCircuitStore((state) => state.isReadOnly);
  const [fromComponentId, setFromComponentId] = useState("");
  const [fromPinId, setFromPinId] = useState("");
  const [toComponentId, setToComponentId] = useState("");
  const [toPinId, setToPinId] = useState("");

  const component = components.find((item) => item.id === selectedId);
  const fromComponent =
    components.find((item) => item.id === fromComponentId) ?? components[0];
  const toComponent =
    components.find(
      (item) => item.id === toComponentId && item.id !== fromComponent?.id,
    ) ?? components.find((item) => item.id !== fromComponent?.id);
  const fromPins = fromComponent ? getConnectablePins(fromComponent) : [];
  const toPins = toComponent ? getConnectablePins(toComponent) : [];
  const fromPin = fromPins.find((pin) => pin.id === fromPinId) ?? fromPins[0];
  const toPin = toPins.find((pin) => pin.id === toPinId) ?? toPins[0];
  const pinouts = component
    ? component.type === "breadboard"
      ? ["r0c0–r19c7", "rail_pos_0–19", "rail_neg_0–19"]
      : getComponentDefinition(component.type).pins.map((pin) => pin.label)
    : [];

  const handlePositionChange = (axisIndex: number, value: string) => {
    if (!component || value === "") return;

    const newPosition: [number, number, number] = [...component.position];

    newPosition[axisIndex] = Number(value);

    updatePosition(component.id, newPosition);
  };

  const handlePropertyChange = (
    key: string,
    value: string | number | boolean,
  ) => {
    if (!component) return;

    updateComponentProperties(component.id, {
      [key]: value,
    });
  };

  const handleRotation = () => {
    if (!component) return;

    updateRotation(component.id, component.rotation + Math.PI / 2);
  };

  const renderTextField = (
    label: string,
    key: string,
    defaultValue: string,
  ) => (
    <div className="space-y-1" key={key}>
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="text"
        value={String(component?.properties[key] ?? defaultValue)}
        disabled={isReadOnly}
        onChange={(e) => handlePropertyChange(key, e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );

  const renderNumberField = (
    label: string,
    key: string,
    defaultValue: number,
    unit?: string,
  ) => (
    <div className="space-y-1" key={key}>
      <label className="text-xs text-gray-400">{label}</label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={Number(component?.properties[key] ?? defaultValue)}
          disabled={isReadOnly}
          onChange={(e) => {
            if (e.target.value === "") return;

            handlePropertyChange(key, Number(e.target.value));
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );

  const renderComponentSettings = () => {
    if (!component) return null;

    switch (component.type) {
      case "esp32":
        return (
          <>
            <h3 className="text-sm font-semibold mb-3">ESP32 Configuration</h3>

            {renderTextField("Board Model", "boardModel", "ESP32 DevKit V1")}

            {renderNumberField("Logic Voltage", "logicVoltage", 3.3, "V")}

            {renderTextField(
              "GPIO Configuration",
              "gpioConfiguration",
              "GPIO2, GPIO4, GPIO5",
            )}
          </>
        );

      case "led":
        return (
          <>
            <h3 className="text-sm font-semibold mb-3">LED Configuration</h3>

            {renderTextField("LED Color", "color", "Red")}

            {renderNumberField("Forward Voltage", "forwardVoltage", 2, "V")}
          </>
        );

      case "resistor":
        return (
          <>
            <h3 className="text-sm font-semibold mb-3">
              Resistor Configuration
            </h3>

            {renderNumberField("Resistance", "resistanceOhms", 220, "Ω")}

            {renderNumberField("Tolerance", "tolerance", 5, "%")}
          </>
        );

      case "dht22":
        return (
          <>
            <h3 className="text-sm font-semibold mb-3">DHT22 Configuration</h3>

            {renderNumberField(
              "Sampling Interval",
              "samplingIntervalMs",
              2000,
              "ms",
            )}

            {renderNumberField(
              "Simulated temperature",
              "temperatureC",
              25.4,
              "°C",
            )}

            {renderNumberField("Simulated humidity", "humidityPercent", 58.2, "%")}

            {renderTextField("Data GPIO", "dataGpio", "GPIO4")}
          </>
        );

      case "breadboard":
        return (
          <>
            <h3 className="text-sm font-semibold mb-3">
              Breadboard Configuration
            </h3>

            <div className="rounded-lg bg-gray-800 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rows</span>
                <span>20</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Columns</span>
                <span>8</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Power rails</span>
                <span>2</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Breadboard dimensions are fixed in the current simulator.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="properties-panel w-72 shrink-0 bg-[#111827] border-l border-gray-800 text-white p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="font-semibold text-lg">Properties</h2>
        <p className="text-xs text-gray-400 mt-1">Wire parts and configure components</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cable size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold">Wire components</h3>
        </div>
        <p className="text-xs text-gray-500">
          Choose components and pin names here; you don’t need to click the tiny pins in the 3D view.
        </p>

        {components.length < 2 ? (
          <p className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400">
            Add at least two components to create a wire.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="wire-from-component" className="block text-xs text-gray-400">From component</label>
              <select
                id="wire-from-component"
                value={fromComponent?.id ?? ""}
                disabled={isReadOnly}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setFromComponentId(nextId);
                  setFromPinId("");
                  if (nextId === toComponent?.id) {
                    setToComponentId("");
                    setToPinId("");
                  }
                }}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {components.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.type.toUpperCase()})</option>
                ))}
              </select>
              <label htmlFor="wire-from-pin" className="block text-xs text-gray-400">From pin</label>
              <select
                id="wire-from-pin"
                value={fromPin?.id ?? ""}
                disabled={isReadOnly || fromPins.length === 0}
                onChange={(event) => setFromPinId(event.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {fromPins.map((pin) => <option key={pin.id} value={pin.id}>{pin.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="wire-to-component" className="block text-xs text-gray-400">To component</label>
              <select
                id="wire-to-component"
                value={toComponent?.id ?? ""}
                disabled={isReadOnly || components.length < 2}
                onChange={(event) => {
                  setToComponentId(event.target.value);
                  setToPinId("");
                }}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {components
                  .filter((item) => item.id !== fromComponent?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.type.toUpperCase()})</option>
                  ))}
              </select>
              <label htmlFor="wire-to-pin" className="block text-xs text-gray-400">To pin</label>
              <select
                id="wire-to-pin"
                value={toPin?.id ?? ""}
                disabled={isReadOnly || toPins.length === 0}
                onChange={(event) => setToPinId(event.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {toPins.map((pin) => <option key={pin.id} value={pin.id}>{pin.label}</option>)}
              </select>
            </div>

            <button
              type="button"
              disabled={isReadOnly || !fromComponent || !toComponent || !fromPin || !toPin}
              onClick={() => {
                if (!fromComponent || !toComponent || !fromPin || !toPin) return;
                addConnection(
                  { componentId: fromComponent.id, pinId: fromPin.id },
                  { componentId: toComponent.id, pinId: toPin.id },
                );
              }}
              className="w-full rounded-lg bg-blue-600 p-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create wire
            </button>
            <p className="text-xs text-gray-500">{connections.length} wire{connections.length === 1 ? "" : "s"} in this circuit</p>
            {connectionFeedback && (
              <p className="text-xs text-blue-300" role="status">{connectionFeedback}</p>
            )}
          </div>
        )}
      </section>

      <div className="my-4 border-t border-gray-800" />

      {!component ? (
        <div className="flex flex-col items-center justify-center text-center mt-16 gap-3">
          <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
            <Settings2 size={25} className="text-gray-500" />
          </div>

          <p className="text-sm text-gray-400">No component selected</p>

          <p className="text-xs text-gray-500">
            Select a component in the 3D workspace to view its properties.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Component Information */}
          <section className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Component Name
              </label>

              <input
                type="text"
                value={component.name}
                disabled={isReadOnly}
                onChange={(e) =>
                  updateComponentName(component.id, e.target.value)
                }
                className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Component Type
              </label>

              <div className="mt-2">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                  {component.type.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 break-all">
              ID: {component.id}
            </p>
          </section>

          <div className="border-t border-gray-800" />

          <section className="pinout-section">
            <h3 className="text-sm font-semibold mb-3">Available pins</h3>
            <div className="pinout-list">
              {pinouts.map((pin) => (
                <span key={pin} className="pinout-chip">{pin}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Create connections with the Wire components controls above, or click two pins in the scene.</p>
          </section>

          <div className="border-t border-gray-800" />

          {/* Component-specific settings */}
          <section className="space-y-3">{renderComponentSettings()}</section>

          <div className="border-t border-gray-800" />

          {/* Position */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Position</h3>

            <div className="space-y-3">
              {(["X", "Y", "Z"] as const).map((axis, index) => (
                <div
                  key={axis}
                  className="flex items-center justify-between gap-3"
                >
                  <label className="text-sm text-gray-400 w-5">{axis}</label>

                  <input
                    type="number"
                    step="0.1"
                    value={component.position[index]}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      handlePositionChange(index, e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-800" />

          {/* Rotation */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Rotation</h3>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Y Axis</span>

              <span className="text-sm">
                {(component.rotation * (180 / Math.PI)).toFixed(0)}°
              </span>
            </div>

            <button
              onClick={handleRotation}
              disabled={isReadOnly}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-2 text-sm transition"
            >
              <RotateCw size={16} />
              Rotate 90°
            </button>
          </section>

          <div className="border-t border-gray-800" />

          {/* Delete */}
          <button
            onClick={() => removeComponent(component.id)}
            disabled={isReadOnly}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg p-3 text-sm transition"
          >
            <Trash2 size={16} />
            Delete Component
          </button>
        </div>
      )}
    </aside>
  );
}
