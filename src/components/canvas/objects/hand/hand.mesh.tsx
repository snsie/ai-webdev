import * as THREE from 'three';
import React, { memo, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useGraph, useThree } from '@react-three/fiber';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RigidBody } from '@react-three/rapier';
import { GLTF } from 'three-stdlib';
import getBoneName from '@/utils/get-bone-name';
import getQuatWrist from '@/utils/get-quat-wrist';
import getRotMcp from '@/utils/get-rot-mcp';
import getRotThumb from '@/utils/get-rot-thumb';
import { handIndices } from '@/utils/store';

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
  const kinThumbRef = useRef<any>(null!);
  const skinnedMeshRef = useRef<any>(null!);
  const clone = useMemo(
    () =>
      SkeletonUtils.clone(useGLTF('/gltf/hand_model_parented_sub.glb').scene),
    []
  );
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { viewport } = useThree();

  // RigidBody refs
  const indexFingerRef = useRef<any>(null);
  const thumbRef = useRef<any>(null);
  const middleFingerRef = useRef<any>(null);

  // Track grabbing
  const [isGrabbing, setIsGrabbing] = useState(false);
  const grabbedObjectRef = useRef<any>(null);
  const [pinchDistance, setPinchDistance] = useState(10);
  const thumbTouchingRef = useRef<any>(null);
  const indexTouchingRef = useRef<any>(null);
  const PINCH_THRESHOLD = 0.5;
  const grabCooldownRef = useRef(false);
  const grabStartOrientationRef = useRef(new THREE.Quaternion());
  const wristOrientationRef = useRef(new THREE.Quaternion());

  useFrame(() => {
    if (!handLabelRefs.current[handLabel]) return;

    // Place hand at wrist position
    wristPosition.set(
      viewport.width * basePosRef.current[0],
      viewport.height * basePosRef.current[1],
      0
    );
    groupRef.current.position.copy(wristPosition);
    wristOrientationRef.current.copy(groupRef.current.quaternion);

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

    // Update fingertip positions
    const skeleton = skinnedMeshRef.current.skeleton;
    function updateFingerRB(fingerRef: any, boneName: string) {
      if (!fingerRef.current) return;
      const bone = skeleton.getBoneByName(boneName);
      if (!bone) return;
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      bone.getWorldPosition(pos);
      bone.getWorldQuaternion(quat);
      // pos.set(
      //   parseFloat(pos.x.toFixed(2)),
      //   parseFloat(pos.y.toFixed(2)),
      //   parseFloat(pos.z.toFixed(2))
      // );
      console.log(
        `Finger position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(
          2
        )}, z=${pos.z.toFixed(2)}`
      );
      fingerRef.current.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
      fingerRef.current.setRotation(quat, true);
    }

    // updateFingerRB(indexFingerRef, getBoneName(7)); // index tip bone
    updateFingerRB(thumbRef, getBoneName(3)); // thumb tip bone
    // updateFingerRB(middleFingerRef, getBoneName(11)); // middle tip bone

    // Calculate pinch distance
    const indexTip = new THREE.Vector3().setFromMatrixPosition(
      skeleton.getBoneByName(getBoneName(7))?.matrixWorld
    );
    const thumbTip = new THREE.Vector3().setFromMatrixPosition(
      skeleton.getBoneByName(getBoneName(3))?.matrixWorld
    );
    const thumbToIndexDistance = thumbTip.distanceTo(indexTip);
    setPinchDistance(thumbToIndexDistance);

    // Start grab
    if (
      !isGrabbing &&
      !grabCooldownRef.current &&
      thumbTouchingRef.current &&
      indexTouchingRef.current &&
      thumbTouchingRef.current === indexTouchingRef.current &&
      thumbToIndexDistance < PINCH_THRESHOLD
    ) {
      setIsGrabbing(true);
      grabbedObjectRef.current = thumbTouchingRef.current;
      grabStartOrientationRef.current.copy(wristOrientationRef.current);
      if (grabbedObjectRef.current) {
        grabbedObjectRef.current.setBodyType(1);
        grabCooldownRef.current = true;
        setTimeout(() => (grabCooldownRef.current = false), 500);
      }
    }

    // Move grabbed object
    if (isGrabbing && grabbedObjectRef.current) {
      const midPoint = new THREE.Vector3()
        .addVectors(thumbTip, indexTip)
        .multiplyScalar(0.5);
      grabbedObjectRef.current.setTranslation(
        { x: midPoint.x, y: midPoint.y, z: midPoint.z },
        true
      );

      // Rotate based on wrist
      const deltaRotation = new THREE.Quaternion().copy(
        wristOrientationRef.current
      );
      deltaRotation.premultiply(
        grabStartOrientationRef.current.clone().invert()
      );
      const targetRotation = new THREE.Quaternion();
      targetRotation.multiplyQuaternions(
        deltaRotation,
        grabbedObjectRef.current.rotation
      );
      grabbedObjectRef.current.setRotation(targetRotation, true);
      grabStartOrientationRef.current.copy(wristOrientationRef.current);

      // Release on distance
      if (
        thumbToIndexDistance > PINCH_THRESHOLD * 2 &&
        !grabCooldownRef.current
      ) {
        setIsGrabbing(false);
        grabbedObjectRef.current.setBodyType(0);
        const throwVelocity = new THREE.Vector3()
          .subVectors(midPoint, wristPosition)
          .normalize()
          .multiplyScalar(5);
        grabbedObjectRef.current.setLinvel(
          { x: throwVelocity.x, y: throwVelocity.y, z: throwVelocity.z },
          true
        );
        grabbedObjectRef.current = null;
        grabCooldownRef.current = true;
        setTimeout(() => (grabCooldownRef.current = false), 500);
      }
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
      />
      {/* Optional visible box */}
      <RigidBody
        colliders="cuboid"
        type="kinematicPosition"
        position={[0, 0, 0]}
        mass={1}
        friction={0.7}
        restitution={0.1}
      >
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial />
        </mesh>
      </RigidBody>

      {/* Physics spheres for fingertips */}
      <RigidBody
        ref={indexFingerRef}
        colliders="ball"
        type="kinematicPosition"
        position={[0, 0, 0]}
        mass={0.1}
        friction={0.7}
        restitution={0.1}
        sensor
        onIntersectionEnter={(e) => {
          if (e.other && e.other.rigidBody) {
            indexTouchingRef.current = e.other.rigidBody;
          }
        }}
        onIntersectionExit={(e) => {
          if (
            e.other &&
            e.other.rigidBody &&
            (!isGrabbing ||
              indexTouchingRef.current !== grabbedObjectRef.current)
          ) {
            if (indexTouchingRef.current === e.other.rigidBody) {
              indexTouchingRef.current = null;
            }
          }
        }}
      >
        <mesh visible={true}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={isGrabbing ? '#00ff00' : 'blue'}
            transparent
            opacity={0.3}
          />
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
        onIntersectionEnter={(e) => {
          if (e.other && e.other.rigidBody) {
            thumbTouchingRef.current = e.other.rigidBody;
          }
        }}
        onIntersectionExit={(e) => {
          if (
            e.other &&
            e.other.rigidBody &&
            (!isGrabbing ||
              thumbTouchingRef.current !== grabbedObjectRef.current)
          ) {
            if (thumbTouchingRef.current === e.other.rigidBody) {
              thumbTouchingRef.current = null;
            }
          }
        }}
      >
        <mesh ref={kinThumbRef} visible={true}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={isGrabbing ? '#00ff00' : 'green'}
            transparent
            opacity={0.3}
          />
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
