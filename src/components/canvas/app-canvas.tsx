import { Canvas } from '@react-three/fiber';
// import BoxAnimatedMesh from '@/components/canvas/objects/box-animated/box-animated.mesh';
import styles from '@/styles/app-canvas.styles.module.css';
import HandMesh from './objects/hand/hand.mesh';
// import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { Environment } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import PhysicsBox from './objects/physics-box/physics-box.mesh';
import PhysicsFloor from './objects/physics-floor/physics-floor.mesh';
// import HandSkeletonLines from './objects/hand/hand-skeleton-lines.mesh';
// import HandSkeletonJoints from './objects/hand/hand-skeleton-joints.mesh';
export default function AppCanvas({ handRefs, ...props }) {
  const [
    handLabelRefs,
    basePosRightRef,
    keypointsRightRef,
    basePosLeftRef,
    keypointsLeftRef,
  ] = handRefs;
  // console.log(handLabelRefs);
  // This reference gives us direct access to the THREE.Mesh object
  return (
    <Canvas className={styles.appCanvas} shadows>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} castShadow />
      <pointLight position={[-5, 5, 4]} intensity={11.5} />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Add physics floor to prevent objects from falling through */}
        <PhysicsFloor />

        {/* Add multiple boxes for interaction */}
        <PhysicsBox position={[0, 3, 0]} />
        <PhysicsBox position={[1, 5, 1]} />
        <PhysicsBox position={[-1, 4, -1]} />

        <Suspense fallback={null}>
          <HandMesh
            handLabelRefs={handLabelRefs}
            handLabel="Right"
            basePosRef={basePosRightRef}
            keypoints3dRef={keypointsRightRef}
            position={[2, 0, 0]}
          />
          {/* <HandMesh
            handLabelRefs={handLabelRefs}
            handLabel="Left"
            basePosRef={basePosLeftRef}
            keypoints3dRef={keypointsLeftRef}
            position={[-2, 0, 0]}
            scale={[-1, 1, 1]}
          /> */}
        </Suspense>
      </Physics>

      <Environment
        background
        preset="warehouse"
        // files="/hdr/peppermint_powerplant_2_1k.hdr"
        // backgroundBlurriness={0.7}
      />
      {/* <BoxAnimatedMesh position={[0, 0, -3]} /> */}
      {/* <HandSkeletonLines keypoints3dRef={keypointsRightRef} />
      <HandSkeletonJoints keypoints3dRef={keypointsRightRef} />
      <HandSkeletonLines keypoints3dRef={keypointsLeftRef} />
      <HandSkeletonJoints keypoints3dRef={keypointsLeftRef} /> */}

      {/* <Suspense fallback={null}>
        <Environment preset="warehouse" />
      </Suspense> */}
      {/* <OrbitControls /> */}
    </Canvas>
  );
}
