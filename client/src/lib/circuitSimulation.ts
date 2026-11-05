import { SimulationController, type SimulationResult } from "@/engine/simulationEngine";
import type { CircuitComponent, CircuitConnection, GpioMode } from "@/types/circuit";

export type { SimulationResult };

const simulationController = new SimulationController();

export function evaluateCircuit(
  components: CircuitComponent[],
  connections: CircuitConnection[],
  gpioStates: Record<string, boolean>,
  gpioModes?: Record<string, GpioMode>,
): SimulationResult {
  return simulationController.evaluate(components, connections, gpioStates, gpioModes);
}
