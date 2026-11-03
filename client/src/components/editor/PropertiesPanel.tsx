"use client";

import { useCircuitStore } from "@/store/circuitStore";
import {
  getComponentDefinition,
  type ComponentPropertyDefinition,
} from "@/lib/componentCatalog";
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
  const definition = component
    ? getComponentDefinition(component.type)
    : null;

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

  const renderPropertyField = (property: ComponentPropertyDefinition) => {
    if (!component) return null;

    const value = component.properties[property.key] ?? property.defaultValue;
    if (property.kind === "boolean") {
      return (
        <label key={property.key} className="flex items-center justify-between gap-3 text-sm text-gray-300">
          {property.label}
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              handlePropertyChange(property.key, event.target.checked)
            }
          />
        </label>
      );
    }

    if (property.kind === "number") {
      return (
        <div className="space-y-1" key={property.key}>
          <label className="text-xs text-gray-400">{property.label}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              value={Number(value)}
              onChange={(event) => {
                if (event.target.value !== "") {
                  handlePropertyChange(property.key, Number(event.target.value));
                }
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {property.unit && (
              <span className="text-xs text-gray-400">{property.unit}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1" key={property.key}>
        <label className="text-xs text-gray-400">{property.label}</label>
        <input
          type="text"
          value={String(value)}
          onChange={(event) => handlePropertyChange(property.key, event.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  const renderComponentSettings = () => {
    if (!definition) return null;
    if (definition.properties.length === 0) {
      return (
        <p className="text-xs text-gray-500">
          This {definition.name.toLowerCase()} has no adjustable specifications.
        </p>
      );
    }

    return (
      <>
        <h3 className="text-sm font-semibold mb-3">
          {definition.name} specifications
        </h3>
        {definition.properties.map(renderPropertyField)}
      </>
    );
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
              {definition?.pins.map((pin) => (
                <span key={pin} className="pinout-chip">{pin}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Click any two pins in the scene to create a wire.</p>
          </section>

          <div className="border-t border-gray-800" />

          {/* Component-specific settings */}
          <section className="space-y-3">{renderComponentSettings()}</section>

          {(component.type === "button" || component.type === "switch") && (
            <p className="rounded-md border border-lime-300/10 bg-lime-300/5 px-3 py-2 text-xs leading-relaxed text-lime-100/80">
              This is a live simulation input. Change its state above while the
              simulation is running to open or close its electrical path.
            </p>
          )}

          {component.type === "dht22" && (
            <p className="rounded-md border border-sky-300/10 bg-sky-300/5 px-3 py-2 text-xs leading-relaxed text-sky-100/80">
              Adjust the simulated environment values above, then run the
              circuit to publish the readings to the console.
            </p>
          )}

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
