import { numKeypoints, numKeypoints3d } from '@/utils/store';
import { fingerLookupIndices } from '@/webcam/webcam-params';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function HandSkeletonLines({ keypoints3dRef, ...props }) {
  const pointsRef = useRef<THREE.Line>(null!);
  // const thumbLineRef = useRef<THREE.Line>(null!);
  useFrame(() => {
    const positionsArray: any =
      pointsRef.current.geometry.attributes.position.array;
    // let x, y, z, index;
    // x = y = z = index = 0;
    for (let i = 0, l = positionsArray.length; i < l; i++) {
      positionsArray[i] = keypoints3dRef.current[i];
      //   positionsArray[i] = y;
      //   positionsArray[index++] = z;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    // console.log(pointsRef.current.geometry.attributes.position.array);
    // pointsRef.current.geometry.setAttribute(
    //   'position'
    // ).attributes.position.array = keypoints3dRef.current;
    for (let i = 0; i < fingerLookupIndices.thumb.length; i++) {}
  });
  return (
    <group scale={12} {...props}>
      <line ref={pointsRef as any}>
        <lineBasicMaterial color="blue" />
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={numKeypoints}
            array={keypoints3dRef.current}
            itemSize={3}
          />
        </bufferGeometry>
      </line>
      {/* <line ref={thumbLineRef as any}>
        <lineBasicMaterial color="blue" />
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={numKeypoints}
            array={keypoints3dRef.current}
            itemSize={3}
          />
        </bufferGeometry>
      </line> */}
    </group>
  );
}
// function createLinesGeom() {
//   const points: any = [];
//   points.push(new THREE.Vector3(-10, 0, 0));
//   points.push(new THREE.Vector3(0, 10, 0));
//   points.push(new THREE.Vector3(10, 0, 0));
//   const geometry = new THREE.BufferGeometry().setFromPoints(points);
// }
// function createPointsGeom(vertices) {
//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute(
//     'position',
//     new THREE.Float32BufferAttribute(vertices, 3)
//   );
// }
