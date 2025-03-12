import * as THREE from 'three';
import React, { memo, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useGraph, useThree } from '@react-three/fiber';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTF } from 'three-stdlib';
import getBoneName from '@/utils/get-bone-name';
import getQuatWrist from '@/utils/get-quat-wrist';
import getRotMcp from '@/utils/get-rot-mcp';
import getRotThumb from '@/utils/get-rot-thumb';
import { handIndices } from '@/utils/store';
import { RigidBody } from '@react-three/rapier';

type GLTFResult = GLTF & {
  nodes: {
    hand: THREE.SkinnedMesh;
    bone000: THREE.Bone;
  };
  materials: {
    ['Material #46']: THREE.MeshStandardMaterial;
  };
};

const wristPosition = new THREE.Vector3();

export default function HandMesh({
  handLabelRefs,
  handLabel,
  basePosRef,
  keypoints3dRef,
  ...props
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const skinnedMeshRef = useRef<any>(null!);
  const clone = useMemo(
    () =>
      SkeletonUtils.clone(useGLTF('/gltf/hand_model_parented_sub.glb').scene),
    []
  );
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { viewport } = useThree();

  // RigidBody refs for physics interactions
  const indexFingerRef = useRef<any>(null);
  const thumbRef = useRef<any>(null);
  const middleFingerRef = useRef<any>(null);

  useFrame(() => {
    if (!handLabelRefs.current[handLabel]) return;

    // Place hand at wrist position
    wristPosition.set(
      viewport.width * basePosRef.current[0],
      viewport.height * basePosRef.current[1],
      0
    );
    groupRef.current.position.copy(wristPosition);

    // Animate bone rotations
    getQuatWrist(
      'Left',
      groupRef.current,
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      0,
      5,
      13
    );

    // Apply finger rotations
    getRotMcp(
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      handIndices.pinkyMcp
    );
    getRotMcp(
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      handIndices.indexMcp
    );
    getRotMcp(
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      handIndices.middleMcp
    );
    getRotMcp(
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      handIndices.ringMcp
    );
    getRotThumb(
      skinnedMeshRef.current.skeleton,
      keypoints3dRef.current,
      handIndices.thumbCmc
    );

    // Update fingertip positions for physics
    function updateFingerRB(fingerRef: any, keypointIndex: number) {
      if (
        !fingerRef.current ||
        keypointIndex * 3 >= keypoints3dRef.current.length
      )
        return;

      // Get the position of the fingertip
      const pos = new THREE.Vector3(
        keypoints3dRef.current[keypointIndex * 3],
        keypoints3dRef.current[keypointIndex * 3 + 1],
        keypoints3dRef.current[keypointIndex * 3 + 2] || 0
      );

      // Scale to viewport dimensions
      pos.x = viewport.width * pos.x;
      pos.y = viewport.height * pos.y;

      // Set the position of the physics body
      fingerRef.current.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    }

    // Update physics bodies if they exist
    if (indexFingerRef.current) {
      updateFingerRB(indexFingerRef, 8); // Index fingertip
    }
    if (thumbRef.current) {
      updateFingerRB(thumbRef, 4); // Thumb tip
    }
    if (middleFingerRef.current) {
      updateFingerRB(middleFingerRef, 12); // Middle fingertip
    }
  });

  return (
    <group ref={groupRef} dispose={null} {...props}>
      <primitive object={nodes.bone000} />
      <skinnedMesh
        ref={skinnedMeshRef}
        geometry={nodes.hand.geometry}
        material={materials['Material #46']}
        skeleton={nodes.hand.skeleton}
        castShadow
      />

      {/* Physics colliders for fingertips */}
      <RigidBody
        ref={indexFingerRef}
        colliders="ball"
        type="kinematicPosition"
        position={[0, 0, 0]}
        mass={0.1}
        friction={0.7}
        restitution={0.1}
        sensor
      >
        <mesh visible={true}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="blue" transparent opacity={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={thumbRef}
        colliders="ball"
        type="kinematicPosition"
        position={[0, 0, 0]}
        mass={0.1}
        friction={0.7}
        restitution={0.1}
        sensor
      >
        <mesh visible={true}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="green" transparent opacity={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={middleFingerRef}
        colliders="ball"
        type="kinematicPosition"
        position={[0, 0, 0]}
        mass={0.1}
        friction={0.7}
        restitution={0.1}
        sensor
      >
        <mesh visible={true}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="red" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
    </group>
  );
}
