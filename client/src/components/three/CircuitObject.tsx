"use client";

import { useRef } from "react";
import type { Group } from "three";
import { Html, TransformControls } from "@react-three/drei";

import { useCircuitStore } from "@/store/circuitStore";
import type { CircuitComponent } from "@/types/circuit";
import CircuitPin from "./CircuitPin";
import { getStaticPinPositions } from "./PinPositions";

type TransformMode = "translate" | "rotate";

interface Props {
  component: CircuitComponent;
  mode: TransformMode;
  onTransformStart: () => void;
  onTransformEnd: () => void;
}

function getPinColor(pinId: string) {
  if (/^(GND|negative|cathode|COM)$/i.test(pinId)) return "#374151";
  if (/^(3V3|5V|VCC|VOUT|positive|anode)$/i.test(pinId)) return "#ef4444";
  if (/^(DATA|SDA|SCL|SIGNAL|GPIO|D\d|A\d|TRIG|ECHO)$/i.test(pinId)) {
    return "#60a5fa";
  }
  return "#facc15";
}

function getBooleanProperty(
  component: CircuitComponent,
  key: string,
  fallback = false,
) {
  const value = component.properties[key];
  return typeof value === "boolean" ? value : fallback;
}

function ComponentPins({ component }: { component: CircuitComponent }) {
  const pins = getStaticPinPositions(component.type);
  if (!pins) return null;

  return Object.entries(pins).map(([pinId, position]) => (
    <CircuitPin
      key={pinId}
      componentId={component.id}
      pinId={pinId}
      position={position}
      color={getPinColor(pinId)}
    />
  ));
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
      {selected && component.type !== "breadboard" && (
        <Html position={[0, 0.65, 0]} center distanceFactor={9}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-lime-200 shadow-lg">
            {component.name}
          </div>
        </Html>
      )}
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

      {/* Arduino Uno */}
      {component.type === "arduino" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[2.5, 0.14, 1.1]} />
            <meshStandardMaterial
              color={selected ? "#2563eb" : "#1f5fa8"}
              metalness={0.2}
              roughness={0.65}
            />
          </mesh>
          <mesh position={[0.2, 0.1, 0]}>
            <boxGeometry args={[0.62, 0.08, 0.56]} />
            <meshStandardMaterial color="#1d2932" metalness={0.25} />
          </mesh>
          <mesh position={[-1.04, 0.12, 0]}>
            <boxGeometry args={[0.28, 0.22, 0.42]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* Breadboard */}
      {component.type === "breadboard" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[3.2, 0.16, 2]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>

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

      {/* RGB LED */}
      {component.type === "rgbLed" && (
        <group>
          <mesh {...commonProps} position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial
              color={selected ? "#f8fafc" : "#c084fc"}
              emissive="#7e22ce"
              emissiveIntensity={0.45}
            />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* OLED display */}
      {component.type === "oled" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[1.1, 0.12, 0.74]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#1e3a5f"} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.84, 0.02, 0.48]} />
            <meshStandardMaterial color="#0b1c26" emissive="#0b5266" emissiveIntensity={0.45} />
          </mesh>
          <ComponentPins component={component} />
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

      {/* Capacitor */}
      {component.type === "capacitor" && (
        <group>
          <mesh {...commonProps} position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.28, 24]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#245a9b"} metalness={0.35} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.018, 24]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.75} />
          </mesh>
          <mesh position={[-0.07, -0.1, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.27, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
          <mesh position={[0.07, -0.1, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.27, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* Push button */}
      {component.type === "button" && (
        <group>
          <mesh {...commonProps} position={[0, 0, 0]}>
            <boxGeometry args={[0.52, 0.14, 0.42]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#1f2937"} roughness={0.55} />
          </mesh>
          <mesh
            {...commonProps}
            position={[0, getBooleanProperty(component, "pressed") ? 0.1 : 0.16, 0]}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.09, 20]} />
            <meshStandardMaterial color={getBooleanProperty(component, "pressed") ? "#f97316" : "#475569"} metalness={0.25} />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* SPDT toggle switch */}
      {component.type === "switch" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[0.62, 0.18, 0.42]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#334155"} roughness={0.48} />
          </mesh>
          <group
            position={[0, 0.11, 0]}
            rotation={[0, 0, getBooleanProperty(component, "isOn") ? -0.48 : 0.48]}
          >
            <mesh {...commonProps} position={[0, 0.12, 0]}>
              <boxGeometry args={[0.075, 0.27, 0.075]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
            </mesh>
          </group>
          <ComponentPins component={component} />
        </group>
      )}

      {/* Micro servo */}
      {component.type === "servo" && (
        <group>
          <mesh {...commonProps} position={[0, 0.03, 0]}>
            <boxGeometry args={[0.62, 0.38, 0.58]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#245a9b"} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.55} />
          </mesh>
          <mesh position={[0.18, 0.33, 0]}>
            <boxGeometry args={[0.42, 0.035, 0.07]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* DC motor */}
      {component.type === "dcMotor" && (
        <group>
          <mesh {...commonProps} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.5, 32]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#94a3b8"} metalness={0.7} roughness={0.28} />
          </mesh>
          <mesh position={[0.33, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.24, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} />
          </mesh>
          <mesh position={[-0.3, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.12, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* 9 V battery */}
      {component.type === "battery" && (
        <group>
          <mesh {...commonProps} position={[0, 0.08, 0]}>
            <boxGeometry args={[0.58, 0.8, 0.36]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#334155"} roughness={0.48} />
          </mesh>
          <mesh position={[-0.17, 0.52, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            <meshStandardMaterial color="#ef4444" metalness={0.65} />
          </mesh>
          <mesh position={[0.17, 0.5, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.65} />
          </mesh>
          <ComponentPins component={component} />
        </group>
      )}

      {/* Bench power supply */}
      {component.type === "powerSupply" && (
        <group>
          <mesh {...commonProps}>
            <boxGeometry args={[0.92, 0.5, 0.55]} />
            <meshStandardMaterial color={selected ? "#2563eb" : "#1e293b"} metalness={0.25} roughness={0.48} />
          </mesh>
          <mesh position={[0, 0.07, 0.286]}>
            <boxGeometry args={[0.45, 0.2, 0.012]} />
            <meshStandardMaterial color="#071827" emissive="#0b5266" emissiveIntensity={0.55} />
          </mesh>
          {[-0.28, 0.28].map((x, index) => (
            <mesh key={x} position={[x, -0.09, 0.29]}>
              <cylinderGeometry args={[0.075, 0.075, 0.035, 20]} />
              <meshStandardMaterial color={index === 0 ? "#ef4444" : "#111827"} metalness={0.5} />
            </mesh>
          ))}
          <ComponentPins component={component} />
        </group>
      )}
    </group>
  );

  // Transform controls for selected component
  if (!selected) {
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
