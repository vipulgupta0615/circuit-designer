"use client";

import { useCircuitStore } from "@/store/circuitStore";

export default function SimulationConsole() {
  const isRunning = useCircuitStore((state) => state.isRunning);
  const gpioStates = useCircuitStore((state) => state.gpioStates);
  const setGpioState = useCircuitStore((state) => state.setGpioState);

  const ledOn = useCircuitStore((state) => state.ledOn);
  const dht22Connected = useCircuitStore((state) => state.dht22Connected);

  const temperature = useCircuitStore((state) => state.temperature);

  const humidity = useCircuitStore((state) => state.humidity);

  const simulationLogs = useCircuitStore((state) => state.simulationLogs);

  return (
    <div className="h-full overflow-y-auto bg-[#111827] text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Simulation Console</h2>
          <p className="text-xs text-gray-400">
            Monitor your circuit in real time
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isRunning
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {isRunning ? "RUNNING" : "STOPPED"}
        </span>
      </div>

      {/* GPIO Controls */}
      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">ESP32 GPIO Controls</h3>

        <div className="grid grid-cols-3 gap-3">
          {["GPIO2", "GPIO4", "GPIO5"].map((pin) => {
            const high = gpioStates[pin] ?? false;

            return (
              <div
                key={pin}
                className="rounded-lg border border-gray-700 bg-gray-800 p-3"
              >
                <p className="text-xs text-gray-400 mb-2">{pin}</p>

                <p
                  className={`text-sm font-bold mb-3 ${
                    high ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {high ? "HIGH" : "LOW"}
                </p>

                <button
                  disabled={!isRunning}
                  onClick={() => setGpioState(pin, !high)}
                  className="w-full rounded-md bg-blue-600 px-2 py-2 text-xs font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Set {high ? "LOW" : "HIGH"}
                </button>
              </div>
            );
          })}
        </div>

        {!isRunning && (
          <p className="mt-2 text-xs text-gray-500">
            Start the simulation to control GPIO pins.
          </p>
        )}
      </section>

      {/* Output Monitoring */}
      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">Output Monitoring</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">LED Status</p>

            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  ledOn
                    ? "bg-green-400 shadow-[0_0_12px_#4ade80]"
                    : "bg-gray-500"
                }`}
              />

              <span
                className={`font-semibold ${
                  ledOn ? "text-green-400" : "text-gray-400"
                }`}
              >
                {ledOn ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">DHT22 Status</p>

            <p
              className={`font-semibold ${
                dht22Connected ? "text-green-400" : "text-gray-400"
              }`}
            >
              {dht22Connected ? "CONNECTED" : "DISCONNECTED"}
            </p>
          </div>
        </div>
      </section>

      {/* Sensor Readings */}
      <section className="mb-5">
        <h3 className="text-sm font-semibold mb-3">Sensor Readings</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">Temperature</p>

            <p className="text-2xl font-bold">
              {temperature !== null ? `${temperature.toFixed(1)}°C` : "--"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">Humidity</p>

            <p className="text-2xl font-bold">
              {humidity !== null ? `${humidity.toFixed(1)}%` : "--"}
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Sensor values are simulated, not measured from physical hardware.
        </p>
      </section>

      {/* Simulation Logs */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Simulation Logs</h3>

        <div className="h-40 overflow-y-auto rounded-lg border border-gray-700 bg-black p-3 font-mono text-xs">
          {simulationLogs.length === 0 ? (
            <p className="text-gray-500">Waiting for simulation...</p>
          ) : (
            simulationLogs.map((log, index) => (
              <p
                key={`${index}-${log}`}
                className={`mb-2 ${
                  log.includes("ERROR")
                    ? "text-red-400"
                    : log.includes("WARNING")
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {`> ${log}`}
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
