"use client";

import { useMemo, useState } from "react";
import { useCircuitStore } from "@/store/circuitStore";
import { ComponentType } from "@/types/circuit";
import type { LucideIcon } from "lucide-react";

import {
  Cpu,
  CircuitBoard,
  Lightbulb,
  Zap,
  Thermometer,
  Search,
} from "lucide-react";

const componentGroups: {
  title: string;
  items: { type: ComponentType; name: string; icon: LucideIcon; detail: string }[];
}[] = [
  {
    title: "Microcontrollers",
    items: [
      {
        type: "esp32",
        name: "ESP32 DevKit",
        icon: Cpu,
        detail: "Wi-Fi · Bluetooth",
      },
    ],
  },
  {
    title: "Prototyping",
    items: [
      {
        type: "breadboard",
        name: "Breadboard",
        icon: CircuitBoard,
        detail: "400 tie points",
      },
    ],
  },
  {
    title: "Output Components",
    items: [
      {
        type: "led",
        name: "LED",
        icon: Lightbulb,
        detail: "Output · red",
      },
      {
        type: "resistor",
        name: "Resistor 220Ω",
        icon: Zap,
        detail: "Current limiting",
      },
    ],
  },
  {
    title: "Sensors",
    items: [
      {
        type: "dht22",
        name: "DHT22 Sensor",
        icon: Thermometer,
        detail: "Temperature · humidity",
      },
    ],
  },
];

export default function ComponentLibrary() {
  const addComponent = useCircuitStore((state) => state.addComponent);
  const [query, setQuery] = useState("");
  const filteredGroups = useMemo(
    () =>
      componentGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            `${item.name} ${item.detail} ${group.title}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [query],
  );

  return (
    <aside className="component-sidebar w-64 shrink-0 bg-[#111827] border-r border-gray-800 text-white overflow-y-auto">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-semibold text-lg">Components</h2>

        <p className="text-xs text-gray-400 mt-1">
        {componentGroups.reduce((total, group) => total + group.items.length, 0)} parts in your library
        </p>
      </div>

      {/* Search */}
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

      {/* Component Categories */}
      <div className="p-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {group.title}
            </h3>

            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.type}
                    onClick={() => addComponent(item.type)}
                    className="component-library-item w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/70 hover:bg-blue-600/20 hover:border-blue-500 border border-transparent transition text-left"
                    title={`Add ${item.name}`}
                  >
                    <span className="component-icon"><Icon size={17} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm">{item.name}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">{item.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-gray-500">No components match “{query}”.</p>
        )}
      </div>
    </aside>
  );
}
