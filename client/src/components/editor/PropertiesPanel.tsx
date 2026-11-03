"use client";

import { useCircuitStore } from "@/store/circuitStore";
import { Trash2, RotateCw, Settings2 } from "lucide-react";

export default function PropertiesPanel() {
  const components = useCircuitStore((state) => state.components);
  const selectedId = useCircuitStore((state) => state.selectedComponentId);

  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const updatePosition = useCircuitStore((state) => state.updatePosition);
  const updateRotation = useCircuitStore((state) => state.updateRotation);
  const updateComponentName = useCircuitStore(
    (state) => state.updateComponentName,
  );
  const updateComponentProperties = useCircuitStore(
    (state) => state.updateComponentProperties,
  );

  const component = components.find((item) => item.id === selectedId);
  const pinouts: Record<string, string[]> = {
    esp32: ["GND", "3V3", "GPIO2", "GPIO4", "GPIO5"],
    dht22: ["VCC", "DATA", "NC", "GND"],
    led: ["anode", "cathode"],
    resistor: ["pin1", "pin2"],
    breadboard: ["r0c0–r19c7", "rail_pos_0–19", "rail_neg_0–19"],
  };

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
              "Temperature Offset",
              "temperatureOffset",
              0,
              "°C",
            )}

            {renderNumberField("Humidity Offset", "humidityOffset", 0, "%")}
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
        <p className="text-xs text-gray-400 mt-1">Component configuration</p>
      </div>

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
              {pinouts[component.type].map((pin) => (
                <span key={pin} className="pinout-chip">{pin}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Click any two pins in the scene to create a wire.</p>
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
