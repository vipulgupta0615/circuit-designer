"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import CircuitWires from "./CircuitWires";
import { OrbitControls, Grid } from "@react-three/drei";

import { Move3D, Rotate3D } from "lucide-react";

import { useCircuitStore } from "@/store/circuitStore";
import CircuitObject from "./CircuitObject";

type TransformMode = "translate" | "rotate";

interface SceneContentProps {
  mode: TransformMode;
  isTransforming: boolean;
  setIsTransforming: (value: boolean) => void;
}

function SceneContent({
  mode,
  isTransforming,
  setIsTransforming,
}: SceneContentProps) {
  const components = useCircuitStore((state) => state.components);

  const selectComponent = useCircuitStore((state) => state.selectComponent);

  return (
    <>
      {/* Background */}
      <color attach="background" args={["#111827"]} />

      {/* Lighting */}
      <ambientLight intensity={1.5} />

      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />

      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#60a5fa" />

      <hemisphereLight args={["#d7e4dc", "#182321", 1.1]} />

      {/* Workspace Grid */}
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#374151"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={30}
        infiniteGrid
      />

      {/* Circuit Components */}
      {components.map((component) => (
        <CircuitObject
          key={component.id}
          component={component}
          mode={mode}
          onTransformStart={() => setIsTransforming(true)}
          onTransformEnd={() => setIsTransforming(false)}
        />
      ))}
      <CircuitWires />
      {/* Deselect by clicking the floor */}
      <mesh
        position={[0, -0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => selectComponent(null)}
      >
        <planeGeometry args={[100, 100]} />

        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enabled={!isTransforming}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function Scene() {
  const [mode, setMode] = useState<TransformMode>("translate");

  const [isTransforming, setIsTransforming] = useState(false);

  return (
    <div className="scene-shell relative w-full h-full">
      {/* Transform Toolbar */}
      <div className="scene-tools absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#1f2937] border border-gray-700 rounded-lg p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setMode("translate")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
            mode === "translate"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
          title="Move component"
        >
          <Move3D size={17} />
          Move
        </button>

        <button
          type="button"
          onClick={() => setMode("rotate")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
            mode === "rotate"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
          title="Rotate component"
        >
          <Rotate3D size={17} />
          Rotate
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: [5.5, 5.5, 7],
          fov: 42,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <SceneContent
          mode={mode}
          isTransforming={isTransforming}
          setIsTransforming={setIsTransforming}
        />
      </Canvas>
    </div>
  );
}
