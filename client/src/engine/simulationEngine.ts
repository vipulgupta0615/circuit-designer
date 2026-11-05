import { nodeId } from "./CircuitGraph";
import {
  type SimulationDiagnostic,
  validateCircuit,
} from "./connectionValidator";
import type {
  CircuitComponent,
  CircuitConnection,
  GpioMode,
} from "@/types/circuit";

export interface SimulationResult {
  ledOn: boolean;
  dht22Connected: boolean;
  temperature: number | null;
  humidity: number | null;
  diagnostics: SimulationDiagnostic[];
  logs: string[];
}

function numericProperty(component: CircuitComponent, key: string, fallback: number) {
  const value = component.properties[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textProperty(component: CircuitComponent, key: string, fallback: string) {
  const value = component.properties[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function hasComponentPath(
  path: string[] | null,
  component: CircuitComponent,
): boolean {
  return Boolean(path?.some((node) => node.startsWith(`${component.id}:`)));
}

export class SimulationController {
  evaluate(
    components: CircuitComponent[],
    connections: CircuitConnection[],
    gpioStates: Record<string, boolean>,
    gpioModes: Record<string, GpioMode> = {},
  ): SimulationResult {
    const logs: string[] = [];
    const validation = validateCircuit(components, connections);
    const esp32 = components.find((component) => component.type === "esp32");
    const led = components.find((component) => component.type === "led");
    const resistor = components.find((component) => component.type === "resistor");
    const dht22 = components.find((component) => component.type === "dht22");
    const diagnostics = [...validation.diagnostics];

    if (!esp32) {
      diagnostics.push({ code: "ESP32_MISSING", severity: "error", message: "Simulation requires an ESP32 development board." });
      return { ledOn: false, dht22Connected: false, temperature: null, humidity: null, diagnostics, logs: ["[ERROR] ESP32 board not found."] };
    }
    logs.push("[INFO] ESP32 initialized.");

    const gpio2Mode = gpioModes.GPIO2 ?? "OUTPUT";
    const gpio2High = gpioStates.GPIO2 === true;
    let ledOn = false;
    if (led && resistor) {
      const positivePath = validation.electricalGraph.findPath(nodeId(esp32.id, "GPIO2"), nodeId(led.id, "anode"));
      const groundPath = validation.conductiveGraph.findPath(nodeId(led.id, "cathode"), nodeId(esp32.id, "GND"));
      const resistance = numericProperty(resistor, "resistanceOhms", 220);
      const logicVoltage = numericProperty(esp32, "logicVoltage", 3.3);
      const forwardVoltage = numericProperty(led, "forwardVoltage", 2);
      const validLedCircuit = Boolean(positivePath && groundPath && hasComponentPath(positivePath, resistor) && resistance > 0);

      if (!validLedCircuit) {
        diagnostics.push({ code: "LED_CIRCUIT_INCOMPLETE", severity: "warning", message: "LED needs GPIO2 → resistor → anode and cathode → GND paths." });
      } else if (gpio2Mode !== "OUTPUT") {
        diagnostics.push({ code: "GPIO2_NOT_OUTPUT", severity: "warning", message: "GPIO2 must be configured as OUTPUT to drive the LED." });
      } else {
        const currentMilliamps = Math.max(0, ((logicVoltage - forwardVoltage) / resistance) * 1000);
        ledOn = gpio2High && currentMilliamps > 0;
        logs.push(`[INFO] GPIO2 configured as OUTPUT and ${gpio2High ? "HIGH" : "LOW"}.`);
        logs.push(`[INFO] LED ${ledOn ? "turned ON" : "turned OFF"}.`);
      }
    } else {
      diagnostics.push({ code: "LED_PARTS_MISSING", severity: "warning", message: "Add both an LED and a resistor to simulate the status indicator." });
    }

    let dht22Connected = false;
    let temperature: number | null = null;
    let humidity: number | null = null;
    if (dht22) {
      const dataGpio = textProperty(dht22, "dataGpio", "GPIO4");
      const vccConnected = validation.conductiveGraph.hasPath(nodeId(esp32.id, "3V3"), nodeId(dht22.id, "VCC"));
      const dataConnected = validation.conductiveGraph.hasPath(nodeId(esp32.id, dataGpio), nodeId(dht22.id, "DATA"));
      const groundConnected = validation.conductiveGraph.hasPath(nodeId(esp32.id, "GND"), nodeId(dht22.id, "GND"));
      dht22Connected = vccConnected && dataConnected && groundConnected;
      if (!dht22Connected) {
        diagnostics.push({
          code: "DHT22_WIRING_INCOMPLETE",
          severity: "warning",
          message: `DHT22 wiring incomplete — VCC ${vccConnected ? "OK" : "missing"}, DATA ${dataConnected ? "OK" : "missing"}, GND ${groundConnected ? "OK" : "missing"}.`,
        });
      } else {
        temperature = numericProperty(dht22, "temperatureC", 25.4);
        humidity = numericProperty(dht22, "humidityPercent", 58.2);
        logs.push(`[INFO] DHT22 connected on ${dataGpio}.`);
        logs.push(`[INFO] DHT22 temperature: ${temperature.toFixed(1)} °C; humidity: ${humidity.toFixed(1)}%.`);
      }
    } else {
      diagnostics.push({ code: "DHT22_MISSING", severity: "warning", message: "No DHT22 sensor is present." });
    }

    for (const diagnostic of diagnostics) {
      logs.push(`[${diagnostic.severity.toUpperCase()}] ${diagnostic.message}`);
    }

    return { ledOn, dht22Connected, temperature, humidity, diagnostics, logs };
  }
}
