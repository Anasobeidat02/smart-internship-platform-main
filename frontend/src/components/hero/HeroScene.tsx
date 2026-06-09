"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function MorphingOrb() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.6, 96, 96]}>
        <MeshDistortMaterial
          color="#2a5fe0"
          emissive="#22d3ee"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.6}
          distort={0.42}
          speed={1.8}
        />
      </Sphere>
    </Float>
  );
}

function FloatingShard({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.4;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      </mesh>
    </Float>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={0.8} color="#f5b800" />
        <directionalLight position={[0, 5, 5]} intensity={0.6} />
        <Stars radius={50} depth={50} count={1500} factor={3} fade speed={0.5} />
        <MorphingOrb />
        <FloatingShard position={[-2.5, 1.4, -0.5]} color="#22d3ee" />
        <FloatingShard position={[2.6, -1.2, -0.3]} color="#f5b800" />
        <FloatingShard position={[2.2, 1.6, -1]} color="#84aaff" />
        <FloatingShard position={[-2.2, -1.5, -0.8]} color="#4f82ff" />
      </Suspense>
    </Canvas>
  );
}
