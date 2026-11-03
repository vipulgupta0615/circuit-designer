"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Battery,
  Circle,
  CircuitBoard,
  Cpu,
  Fan,
  Lightbulb,
  Monitor,
  MousePointer2,
  Plug,
  Search,
  Thermometer,
  ToggleLeft,
  Zap,
} from "lucide-react";
import { useCircuitStore } from "@/store/circuitStore";
import {
  componentCategories,
  componentDefinitions,
} from "@/lib/componentCatalog";
import type { ComponentType } from "@/types/circuit";

const componentIcons: Record<ComponentType, LucideIcon> = {
  esp32: Cpu,
  arduino: Cpu,
  dht22: Thermometer,
  led: Lightbulb,
  rgbLed: Lightbulb,
  oled: Monitor,
  resistor: Zap,
  capacitor: Circle,
  button: MousePointer2,
  switch: ToggleLeft,
  servo: Fan,
  dcMotor: Fan,
  battery: Battery,
  powerSupply: Plug,
  breadboard: CircuitBoard,
};

export default function ComponentLibrary() {
  const addComponent = useCircuitStore((state) => state.addComponent);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      componentCategories
        .map((category) => ({
          title: category,
          items: componentDefinitions.filter(
            (item) =>
              item.category === category &&
              `${item.name} ${item.detail} ${item.category}`
                .toLowerCase()
                .includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [normalizedQuery],
  );

  return (
    <aside className="component-sidebar w-64 shrink-0 bg-[#111827] border-r border-gray-800 text-white overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-semibold text-lg">Components</h2>
        <p className="text-xs text-gray-400 mt-1">
          {componentDefinitions.length} parts in your library
        </p>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            aria-label="Search components"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-transparent outline-none text-sm w-full text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="p-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = componentIcons[item.type];

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addComponent(item.type)}
                    className="component-library-item w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/70 hover:bg-blue-600/20 hover:border-blue-500 border border-transparent transition text-left"
                    title={`Add ${item.name} to the workspace`}
                  >
                    <span className="component-icon"><Icon size={17} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm">{item.name}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">
                        {item.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-gray-500">
            No components match “{query}”.
          </p>
        )}
      </div>
    </aside>
  );
}
