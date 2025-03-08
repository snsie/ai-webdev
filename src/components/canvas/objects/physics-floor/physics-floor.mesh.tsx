import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';

export default function PhysicsFloor(props) {
  // Create a reference to the rigid body
  const floorRef = useRef(null);

  return (
    <RigidBody
      ref={floorRef}
      type="fixed" // Static body that doesn't move
      position={[0, -2, 0]} // Position below the scene
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal
      friction={0.3} // Moderate friction
      restitution={0.2} // Some bounciness
    >
      <mesh receiveShadow>
        <planeGeometry args={[30, 30]} /> {/* Wide floor */}
        <meshStandardMaterial color="#808080" roughness={0.7} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}
