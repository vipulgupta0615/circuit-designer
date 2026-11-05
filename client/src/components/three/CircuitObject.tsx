"use client";

import { useRef } from "react";
import type { Group } from "three";
import { TransformControls } from "@react-three/drei";

import { useCircuitStore } from "@/store/circuitStore";
import type { CircuitComponent } from "@/types/circuit";
import CircuitPin from "./CircuitPin";

type TransformMode = "translate" | "rotate";

interface Props {
  component: CircuitComponent;
  mode: TransformMode;
  onTransformStart: () => void;
  onTransformEnd: () => void;
}

export default function CircuitObject({
  component,
  mode,
  onTransformStart,
  onTransformEnd,
}: Props) {
  const groupRef = useRef<Group>(null);

  const selectedId = useCircuitStore((state) => state.selectedComponentId);

  const selectComponent = useCircuitStore((state) => state.selectComponent);

  const updatePosition = useCircuitStore((state) => state.updatePosition);

  const updateRotation = useCircuitStore((state) => state.updateRotation);
  const ledOn = useCircuitStore((state) => state.ledOn);
  const isReadOnly = useCircuitStore((state) => state.isReadOnly);

  const selected = selectedId === component.id;

  const commonProps = {
    onClick: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      selectComponent(component.id);
    },
    castShadow: true,
    receiveShadow: true,
  };

  const model = (
    <group
      ref={groupRef}
      position={component.position}
      rotation={[0, component.rotation, 0]}
    >
      {/* ESP32 */}
      {component.type === "esp32" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[2.2, 0.12, 0.8]} />
            <meshStandardMaterial
              color={selected ? "#2563eb" : "#087f5b"}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>

          {/* Metal shield */}
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.75, 0.12, 0.55]} />
            <meshStandardMaterial
              color="#a3a3a3"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* USB connector */}
          <mesh position={[-0.95, 0.1, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.4]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>

          {/* Physical pin headers */}
          {Array.from({ length: 15 }).map((_, i) =>
            [-0.28, 0.28].map((z) => (
              <mesh key={`${i}-${z}`} position={[-0.85 + i * 0.12, 0.12, z]}>
                <boxGeometry args={[0.035, 0.22, 0.035]} />
                <meshStandardMaterial color="#eab308" metalness={0.8} />
              </mesh>
            )),
          )}

          {/* Interactive ESP32 pins */}
          <CircuitPin
            componentId={component.id}
            pinId="GND"
            position={[-0.85, 0.24, 0.28]}
            color="#374151"
          />

          <CircuitPin
            componentId={component.id}
            pinId="3V3"
            position={[-0.49, 0.24, 0.28]}
            color="#ef4444"
          />

          <CircuitPin
            componentId={component.id}
            pinId="GPIO2"
            position={[-0.13, 0.24, 0.28]}
          />

          <CircuitPin
            componentId={component.id}
            pinId="GPIO4"
            position={[0.23, 0.24, 0.28]}
          />

          <CircuitPin
            componentId={component.id}
            pinId="GPIO5"
            position={[0.59, 0.24, 0.28]}
          />
        </group>
      )}

      {/* Breadboard */}
      {/* Breadboard */}
      {component.type === "breadboard" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[3.2, 0.16, 2]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>

          {(["pos", "neg"] as const).map((rail, railIndex) => (
            <group key={rail}>
              <mesh position={[0, 0.095, rail === "pos" ? -0.85 : 0.85]}>
                <boxGeometry args={[2.75, 0.012, 0.035]} />
                <meshStandardMaterial color={rail === "pos" ? "#ef4444" : "#64748b"} />
              </mesh>
              {Array.from({ length: 20 }).map((_, index) => {
                const x = -1.35 + index * 0.14;
                const z = rail === "pos" ? -0.85 : 0.85;
                return (
                  <group key={`${rail}-${index}`}>
                    <mesh position={[x, 0.105, z]}>
                      <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
                      <meshStandardMaterial color="#374151" />
                    </mesh>
                    <CircuitPin
                      componentId={component.id}
                      pinId={`rail_${rail}_${index}`}
                      position={[x, 0.17, z]}
                      color={railIndex === 0 ? "#ef4444" : "#64748b"}
                    />
                  </group>
                );
              })}
            </group>
          ))}

          {Array.from({ length: 20 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => {
              const pinId = `r${row}c${col}`;

              const x = -1.35 + row * 0.14;
              const z = -0.65 + col * 0.18;

              return (
                <group key={pinId}>
                  {/* Physical hole */}
                  <mesh position={[x, 0.09, z]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
                    <meshStandardMaterial color="#374151" />
                  </mesh>

                  {/* Interactive pin */}
                  <CircuitPin
                    componentId={component.id}
                    pinId={pinId}
                    position={[x, 0.17, z]}
                    color="#facc15"
                  />
                </group>
              );
            }),
          )}
        </group>
      )}

      {/* LED */}
      {component.type === "led" && (
        <group>
          <mesh {...commonProps} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial
              color={ledOn ? "#ff6253" : selected ? "#facc15" : "#ef4444"}
              emissive={ledOn ? "#ff3828" : "#ef0000"}
              emissiveIntensity={ledOn ? 2 : 0.3}
            />
          </mesh>

          {/* LED legs */}
          <mesh position={[-0.04, -0.05, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.35]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>

          <mesh position={[0.04, -0.05, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.35]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>

          {/* Interactive LED pins */}
          <CircuitPin
            componentId={component.id}
            pinId="anode"
            position={[-0.04, -0.225, 0]}
            color="#ef4444"
          />

          <CircuitPin
            componentId={component.id}
            pinId="cathode"
            position={[0.04, -0.225, 0]}
            color="#374151"
          />
        </group>
      )}

      {/* Resistor */}
      {/* Resistor */}
      {component.type === "resistor" && (
        <group>
          <mesh {...commonProps}>
            <cylinderGeometry args={[0.12, 0.12, 0.45, 16]} />
            <meshStandardMaterial color="#d6b58c" />
          </mesh>

          <CircuitPin
            componentId={component.id}
            pinId="pin1"
            position={[0, 0, -0.3]}
            color="#9ca3af"
          />

          <CircuitPin
            componentId={component.id}
            pinId="pin2"
            position={[0, 0, 0.3]}
            color="#9ca3af"
          />
        </group>
      )}

      {/* DHT22 */}
      {/* DHT22 */}
      {component.type === "dht22" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[0.55, 0.65, 0.35]} />
            <meshStandardMaterial color={selected ? "#60a5fa" : "#2563eb"} />
          </mesh>

          <CircuitPin
            componentId={component.id}
            pinId="VCC"
            position={[-0.16, -0.35, 0]}
            color="#ef4444"
          />

          <CircuitPin
            componentId={component.id}
            pinId="DATA"
            position={[-0.05, -0.35, 0]}
          />

          <CircuitPin
            componentId={component.id}
            pinId="NC"
            position={[0.05, -0.35, 0]}
            color="#9ca3af"
          />

          <CircuitPin
            componentId={component.id}
            pinId="GND"
            position={[0.16, -0.35, 0]}
            color="#374151"
          />
        </group>
      )}
    </group>
  );

  // Transform controls for selected component
  if (!selected || isReadOnly) {
    return model;
  }

  return (
    <TransformControls
      mode={mode}
      axis={mode === "rotate" ? "Y" : null}
      onMouseDown={onTransformStart}
      onMouseUp={() => {
        const object = groupRef.current;

        if (object) {
          updatePosition(component.id, [
            object.position.x,
            object.position.y,
            object.position.z,
          ]);

          updateRotation(component.id, object.rotation.y);
        }

        onTransformEnd();
      }}
    >
      {model}
    </TransformControls>
  );
}
