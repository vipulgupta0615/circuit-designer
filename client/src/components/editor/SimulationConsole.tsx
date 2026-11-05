"use client";

import { useCircuitStore } from "@/store/circuitStore";

export default function SimulationConsole() {
  const isRunning = useCircuitStore((state) => state.isRunning);
  const isReadOnly = useCircuitStore((state) => state.isReadOnly);
  const gpioStates = useCircuitStore((state) => state.gpioStates);
  const gpioModes = useCircuitStore((state) => state.gpioModes);
  const setGpioState = useCircuitStore((state) => state.setGpioState);
  const setGpioMode = useCircuitStore((state) => state.setGpioMode);
  const setDht22Environment = useCircuitStore((state) => state.setDht22Environment);
  const components = useCircuitStore((state) => state.components);
  const ledOn = useCircuitStore((state) => state.ledOn);
  const dht22Connected = useCircuitStore((state) => state.dht22Connected);
  const temperature = useCircuitStore((state) => state.temperature);
  const humidity = useCircuitStore((state) => state.humidity);
  const diagnostics = useCircuitStore((state) => state.diagnostics);
  const simulationLogs = useCircuitStore((state) => state.simulationLogs);
  const dht22 = components.find((component) => component.type === "dht22");
  const configuredTemperature = typeof dht22?.properties.temperatureC === "number" ? dht22.properties.temperatureC : 25.4;
  const configuredHumidity = typeof dht22?.properties.humidityPercent === "number" ? dht22.properties.humidityPercent : 58.2;

  return (
    <div className="h-full overflow-y-auto bg-[#111827] text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Simulation Console</h2>
          <p className="text-xs text-gray-400">Monitor your circuit in real time</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isRunning ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-300"}`}>
          {isRunning ? "RUNNING" : "STOPPED"}
        </span>
      </div>

      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">ESP32 GPIO Controls</h3>
        <div className="grid grid-cols-3 gap-3">
          {["GPIO2", "GPIO4", "GPIO5"].map((pin) => {
            const high = gpioStates[pin] ?? false;
            const mode = gpioModes[pin] ?? "INPUT";
            return (
              <div key={pin} className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                <p className="text-xs text-gray-400 mb-2">{pin}</p>
                <p className={`text-sm font-bold mb-2 ${high ? "text-green-400" : "text-gray-400"}`}>{high ? "HIGH" : "LOW"}</p>
                <select
                  value={mode}
                  disabled={isReadOnly}
                  onChange={(event) => setGpioMode(pin, event.target.value as "INPUT" | "OUTPUT")}
                  aria-label={`${pin} mode`}
                  className="mb-2 w-full rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-gray-300"
                >
                  <option value="INPUT">INPUT</option>
                  <option value="OUTPUT">OUTPUT</option>
                </select>
                <button
                  disabled={!isRunning || isReadOnly}
                  onClick={() => setGpioState(pin, !high)}
                  className="w-full rounded-md bg-blue-600 px-2 py-2 text-xs font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mode === "INPUT" ? "Simulate" : "Set"} {high ? "LOW" : "HIGH"}
                </button>
              </div>
            );
          })}
        </div>
        {!isRunning && <p className="mt-2 text-xs text-gray-500">Start the simulation to control GPIO pins.</p>}
      </section>

      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">Output Monitoring</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">LED Status</p>
            <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${ledOn ? "bg-green-400 shadow-[0_0_12px_#4ade80]" : "bg-gray-500"}`} /><span className={`font-semibold ${ledOn ? "text-green-400" : "text-gray-400"}`}>{ledOn ? "ON" : "OFF"}</span></div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">DHT22 Status</p>
            <p className={`font-semibold ${dht22Connected ? "text-green-400" : "text-gray-400"}`}>{dht22Connected ? "CONNECTED" : "DISCONNECTED"}</p>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">Sensor Readings</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3"><p className="text-xs text-gray-400 mb-2">Temperature</p><p className="text-2xl font-bold">{temperature !== null ? `${temperature.toFixed(1)}°C` : "--"}</p></div>
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3"><p className="text-xs text-gray-400 mb-2">Humidity</p><p className="text-2xl font-bold">{humidity !== null ? `${humidity.toFixed(1)}%` : "--"}</p></div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Sensor values are simulated, not measured from physical hardware.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[10px] text-gray-400">Environment °C
            <input type="number" step="0.1" disabled={isReadOnly || !dht22} value={configuredTemperature} onChange={(event) => setDht22Environment(Number(event.target.value), configuredHumidity)} className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white" />
          </label>
          <label className="text-[10px] text-gray-400">Environment %
            <input type="number" step="0.1" disabled={isReadOnly || !dht22} value={configuredHumidity} onChange={(event) => setDht22Environment(configuredTemperature, Number(event.target.value))} className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white" />
          </label>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Simulation Logs</h3>
        {diagnostics.length > 0 && (
          <div className="mb-2 max-h-20 overflow-y-auto rounded-lg border border-amber-800/70 bg-amber-950/20 p-2 text-[10px]">
            {diagnostics.map((diagnostic) => <p key={`${diagnostic.code}-${diagnostic.message}`} className={diagnostic.severity === "error" ? "text-red-300" : "text-yellow-300"}>[{diagnostic.severity.toUpperCase()}] {diagnostic.message}</p>)}
          </div>
        )}
        <div className="h-40 overflow-y-auto rounded-lg border border-gray-700 bg-black p-3 font-mono text-xs">
          {simulationLogs.length === 0 ? <p className="text-gray-500">Waiting for simulation...</p> : simulationLogs.map((log, index) => (
            <p key={`${index}-${log}`} className={`mb-2 ${log.includes("[ERROR]") ? "text-red-400" : log.includes("[WARNING]") ? "text-yellow-400" : "text-green-400"}`}>{`> ${log}`}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
