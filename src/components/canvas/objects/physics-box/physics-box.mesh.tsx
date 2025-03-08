import * as THREE from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, vec3 } from '@react-three/rapier';

export default function PhysicsBox(props) {
  // State for hover and click effects
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [touchedByFinger, setTouchedByFinger] = useState(false);
  const [isGrabbed, setIsGrabbed] = useState(false);

  // Create a reference to the rigid body
  const rigidBodyRef = useRef(null);

  // Apply impulse when clicked
  const handleClick = (e) => {
    e.stopPropagation();
    setClicked(!clicked);

    // Apply random impulse when clicked only if not grabbed
    if (rigidBodyRef.current && !isGrabbed) {
      rigidBodyRef.current.applyImpulse(
        vec3({
          x: Math.random() * 5 - 2.5,
          y: 5 + Math.random() * 5,
          z: Math.random() * 5 - 2.5,
        }),
        true
      );
    }
  };

  // Reset touchedByFinger state after a short delay
  useFrame((state, delta) => {
    if (touchedByFinger) {
      const currentTime = state.clock.getElapsedTime();
      if (currentTime - touchedTimestamp > 0.5) {
        setTouchedByFinger(false);
      }
    }

    // Check body type to update grabbed state
    if (rigidBodyRef.current) {
      const bodyType = rigidBodyRef.current.bodyType();
      setIsGrabbed(bodyType === 1); // 1 is kinematic (grabbed)
    }
  });

  // Timestamp for tracking touch events
  const [touchedTimestamp, setTouchedTimestamp] = useState(0);

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={props.position || [0, 3, 0]} // Start higher so it falls onto the floor
      colliders="cuboid"
      mass={0.5} // Lighter to make it easier to move
      restitution={0.2}
      friction={0.7} // Higher friction to make it easier to grab
      linearDamping={0.5} // Damping to prevent excessive movement
      angularDamping={0.5} // Damping to prevent excessive rotation
      onCollisionEnter={() => {
        // Simple collision detection - will fire for any collision
        setTouchedByFinger(true);
        setTouchedTimestamp(performance.now() / 1000); // Convert to seconds
      }}
    >
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={
            isGrabbed
              ? '#00cc00'
              : touchedByFinger
              ? '#ff0000'
              : hovered
              ? 'hotpink'
              : clicked
              ? 'lightblue'
              : 'orange'
          }
          emissive={
            isGrabbed ? '#004400' : touchedByFinger ? '#440000' : '#000000'
          }
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
}
