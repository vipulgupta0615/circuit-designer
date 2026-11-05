
"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { Vector3 } from "three";

import { useCircuitStore } from "@/store/circuitStore";
import { getPinLocalPosition } from "./PinPositions";

import type { CircuitComponent } from "@/types/circuit";

function getWorldPosition(
  component: CircuitComponent,
  pinId: string,
): Vector3 | null {
  const localPosition = getPinLocalPosition(component, pinId);

  if (!localPosition) return null;

  const [x, y, z] = localPosition;
  const cos = Math.cos(component.rotation);
  const sin = Math.sin(component.rotation);

  return new Vector3(
    component.position[0] + x * cos + z * sin,
    component.position[1] + y,
    component.position[2] - x * sin + z * cos,
  );
}

export default function CircuitWires() {
  const connections = useCircuitStore((state) => state.connections);
  const components = useCircuitStore((state) => state.components);
  const removeConnection = useCircuitStore(
    (state) => state.removeConnection,
  );
  const componentsById = useMemo(
    () => new Map(components.map((component) => [component.id, component])),
    [components],
  );

  return (
    <>
      {connections.map((connection) => {
        const fromComponent = componentsById.get(connection.from.componentId);
        const toComponent = componentsById.get(connection.to.componentId);

        if (!fromComponent || !toComponent) return null;

        const start = getWorldPosition(
          fromComponent,
          connection.from.pinId,
        );

        const end = getWorldPosition(
          toComponent,
          connection.to.pinId,
        );

        if (!start || !end) return null;

        // Raise the middle of the wire slightly for a curved-looking route.
        const middle = start.clone().lerp(end, 0.5);
        middle.y += 0.2;

        return (
          <Line
            key={connection.id}
            points={[start, middle, end]}
            color={connection.color}
            lineWidth={3}
            onClick={(event) => {
              event.stopPropagation();
              removeConnection(connection.id);
            }}
          />
        );
      })}
    </>
  );
}
