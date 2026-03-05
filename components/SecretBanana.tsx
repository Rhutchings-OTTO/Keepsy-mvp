"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import type * as THREE from "three";

export function SecretBanana() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.8;
    meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
  });

  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#FFD700" />

      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef} scale={1.5}>
          <torusGeometry args={[1, 0.4, 16, 100, Math.PI / 2]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.9}
            roughness={0.1}
            emissive="#443300"
          />
        </mesh>
      </Float>
    </>
  );
}
