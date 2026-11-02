
"use client";

import { useCircuitStore } from "@/store/circuitStore";
import type { Vector3Tuple } from "three";

interface CircuitPinProps {
  componentId: string;
  pinId: string;
  position: Vector3Tuple;
  color?: string;
}

export default function CircuitPin({
  componentId,
  pinId,
  position,
  color = "#facc15",
}: CircuitPinProps) {
  const pendingPin = useCircuitStore((state) => state.pendingPin);
  const selectPin = useCircuitStore((state) => state.selectPin);

  const isSelected =
    pendingPin?.componentId === componentId &&
    pendingPin?.pinId === pinId;

  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        selectPin({ componentId, pinId });
      }}
    >
      <sphereGeometry args={[0.055, 16, 16]} />
      <meshStandardMaterial
        color={isSelected ? "#22c55e" : color}
        emissive={isSelected ? "#16a34a" : "#000000"}
        emissiveIntensity={isSelected ? 0.8 : 0}
      />
    </mesh>
  );
}
