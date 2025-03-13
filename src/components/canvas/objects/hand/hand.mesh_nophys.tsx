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
  });
  console.log('test');
  return (
    <group ref={groupRef} dispose={null} {...props}>
      <primitive object={nodes.bone000} />
      <skinnedMesh
        ref={skinnedMeshRef}
        geometry={nodes.hand.geometry}
        material={materials['Material #46']}
        skeleton={nodes.hand.skeleton}
      />
    </group>
  );
}
