"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const GOLD = new THREE.MeshPhysicalMaterial({
  color: "#d4af37",
  metalness: 1,
  roughness: 0.12,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  reflectivity: 1,
});

function BananaBody() {
  const points = useMemo(
    () => [
      new THREE.Vector3(-1.4, -0.52, 0),
      new THREE.Vector3(-0.95, -0.18, 0.08),
      new THREE.Vector3(-0.35, 0.12, 0.18),
      new THREE.Vector3(0.35, 0.25, 0.12),
      new THREE.Vector3(0.95, 0.14, -0.02),
      new THREE.Vector3(1.45, -0.24, -0.08),
    ],
    []
  );

  return (
    <group>
      {points.map((point, index) => {
        const scaleX = 0.38 - index * 0.025;
        const scaleY = 0.18 - index * 0.008;
        const scaleZ = 0.16 - index * 0.01;
        return (
          <mesh
            key={`${point.x}-${index}`}
            position={point}
            rotation={[0, 0, 0.25 - index * 0.1]}
            scale={[scaleX, scaleY, scaleZ]}
            material={GOLD}
          >
            <sphereGeometry args={[1, 28, 28]} />
          </mesh>
        );
      })}
      <mesh position={[-1.68, -0.66, 0]} rotation={[0.1, 0.2, -0.4]} material={GOLD}>
        <cylinderGeometry args={[0.045, 0.085, 0.28, 18]} />
      </mesh>
      <mesh position={[1.72, -0.34, 0]} rotation={[0, 0.2, 0.8]} material={GOLD}>
        <cylinderGeometry args={[0.035, 0.075, 0.22, 18]} />
      </mesh>
    </group>
  );
}

export function SecretBanana() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 1.6;
    groupRef.current.rotation.x = Math.sin(t * 1.2) * 0.16;
    groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.08;
  });

  return (
    <>
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} color="#fff8dc" />
      <pointLight position={[-3, -2, 3]} intensity={1.4} color="#ffd76a" />
      <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.6}>
        <group ref={groupRef} scale={0.9}>
          <BananaBody />
        </group>
      </Float>
    </>
  );
}
