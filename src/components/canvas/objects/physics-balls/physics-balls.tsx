import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture, Instances, Instance } from '@react-three/drei';
import {
  RigidBody,
  CuboidCollider,
  BallCollider,
  InstancedRigidBodies,
  InstancedRigidBodyProps,
} from '@react-three/rapier';
import * as THREE from 'three';
import { InstancedMesh } from 'three';

const BALL_COUNT = 100;
const BOUNDS = { x: 10, y: 10, z: 2 }; // Bounds for ball generation

export default function PhysicsBalls() {
  const instancedMeshRef = useRef<InstancedMesh>(null!);
  const rigidBodiesRef = useRef(null);

  // Generate initial positions, rotations, and scales for balls
  // const instances = useMemo(() => {
  //   const instances: InstancedRigidBodyProps[] = [];

  //   for (let i = 0; i < COUNT; i++) {
  //     instances.push({
  //       key: "instance_" + Math.random(),
  //       position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
  //       rotation: [Math.random(), Math.random(), Math.random()]
  //     });
  //   }

  //   return instances;
  // }, []);
  const { viewport } = useThree();
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];

    for (let i = 0; i < BALL_COUNT; i++) {
      instances.push({
        key: 'instance_' + Math.random(),
        position: [
          Math.random() * viewport.width - viewport.width / 2,
          Math.random() * 8,
          Math.random() * 0.5,
        ],
        rotation: [Math.random(), Math.random(), Math.random()],
        scale: Math.random() * 0.2 + 0.2, // Random sizes between 0.5 and 0.8
      });
    }

    return instances;
  }, []);

  // const [instancesold]: InstancedRigidBodyProps[] = useState(() =>
  //   Array(BALL_COUNT)
  //     .fill(null)
  //     .map(() => ({
  //       key: Math.random(),
  //       position: [
  //         (Math.random() - 0.5) * BOUNDS.x,
  //         Math.random() * BOUNDS.y + 2, // Start a bit above ground
  //         (Math.random() - 0.5) * BOUNDS.z,
  //       ],
  //       rotation: [
  //         Math.random() * Math.PI,
  //         Math.random() * Math.PI,
  //         Math.random() * Math.PI,
  //       ],
  //       scale: Math.random() * 0.3 + 0.5, // Random sizes between 0.5 and 0.8
  //     }))
  // );

  // Beach ball texture
  const texture = useTexture('/textures/beachball.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Handle clicking on balls
  const handleClick = (index) => {
    if (rigidBodiesRef.current) {
      rigidBodiesRef.current.at(index)?.applyImpulse(
        {
          x: (Math.random() - 0.5) * 5,
          y: 5 + Math.random() * 5,
          z: (Math.random() - 0.5) * 5,
        },
        true
      );
    }
  };

  return (
    <>
      {/* Floor collider */}
      <RigidBody type="fixed" position={[0, -2.5, 0]}>
        <CuboidCollider args={[20, 0.5, 20]} sensor>
          <mesh
            receiveShadow
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#f0f0f0" transparent opacity={0.2} />
          </mesh>
        </CuboidCollider>
      </RigidBody>

      {/* Walls to keep balls contained */}
      <RigidBody type="fixed" position={[0, BOUNDS.y / 2, -BOUNDS.z / 2]}>
        <CuboidCollider args={[BOUNDS.x, BOUNDS.y, 0.5]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, BOUNDS.y / 2, BOUNDS.z / 2]}>
        <CuboidCollider args={[BOUNDS.x, BOUNDS.y, 0.5]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-viewport.width / 2, BOUNDS.y / 2, 0]}>
        <CuboidCollider args={[0.5, BOUNDS.y, BOUNDS.z]} />
      </RigidBody>
      <RigidBody type="fixed" position={[viewport.width / 2, BOUNDS.y / 2, 0]}>
        <CuboidCollider args={[0.5, BOUNDS.y, BOUNDS.z]} />
      </RigidBody>

      {/* Beach balls using InstancedRigidBodies */}
      <InstancedRigidBodies
        ref={rigidBodiesRef}
        instances={instances}
        colliders="ball"
        restitution={0.8}
        friction={0.2}
        linearDamping={0.15}
        angularDamping={0.15}
        mass={0.3}
      >
        <instancedMesh args={[null, null, BALL_COUNT]} ref={instancedMeshRef}>
          <sphereGeometry attach="geometry" args={[1, 16, 16]} />
          <meshStandardMaterial
            attach="material"
            map={texture}
            roughness={0.3}
            metalness={0.1}
            envMapIntensity={0.5}
          />
        </instancedMesh>
      </InstancedRigidBodies>
    </>
  );
}
