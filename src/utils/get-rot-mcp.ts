import * as THREE from 'three';
import getBoneName from '@/utils/get-bone-name';

const quatWristInverted = new THREE.Quaternion();
const quatMcpInverted = new THREE.Quaternion();

const vec1 = new THREE.Vector3();
const vec2 = new THREE.Vector3();
const vecOrth = new THREE.Vector3();

export default function getRotMcp(skeleton, keypointsArray, indexBot) {
  // Get the wrist quaternion and invert it
  quatWristInverted.copy(skeleton.bones[0].quaternion).invert();

  // Process each joint in the finger (MCP, PIP, DIP)
  let index0 = 0; // Wrist
  let index1 = indexBot; // MCP joint
  let index2 = indexBot + 1; // PIP joint

  // Process the MCP joint (base of finger)
  processFinger(skeleton, keypointsArray, index0, index1, index2, 0.8);

  // Process the PIP joint (middle joint)
  index0 = indexBot;
  index1 = indexBot + 1;
  index2 = indexBot + 2;
  processFinger(skeleton, keypointsArray, index0, index1, index2, 0.9);

  // Process the DIP joint (tip joint)
  index0 = indexBot + 1;
  index1 = indexBot + 2;
  index2 = indexBot + 3;
  processFinger(skeleton, keypointsArray, index0, index1, index2, 0.9);
}

// Helper function to process a finger joint
function processFinger(
  skeleton,
  keypointsArray,
  index0,
  index1,
  index2,
  lerpFactor
) {
  // Skip if any keypoint is missing
  if (
    index0 * 3 + 2 >= keypointsArray.length ||
    index1 * 3 + 2 >= keypointsArray.length ||
    index2 * 3 + 2 >= keypointsArray.length
  ) {
    return;
  }

  // Calculate vectors between joints
  vec1
    .set(
      keypointsArray[index2 * 3 + 0] - keypointsArray[index1 * 3 + 0],
      keypointsArray[index2 * 3 + 1] - keypointsArray[index1 * 3 + 1],
      keypointsArray[index2 * 3 + 2] - keypointsArray[index1 * 3 + 2]
    )
    .normalize();

  vec2
    .set(
      keypointsArray[index1 * 3 + 0] - keypointsArray[index0 * 3 + 0],
      keypointsArray[index1 * 3 + 1] - keypointsArray[index0 * 3 + 1],
      keypointsArray[index1 * 3 + 2] - keypointsArray[index0 * 3 + 2]
    )
    .normalize();

  // Calculate the cross product to find the rotation axis
  vecOrth.crossVectors(vec2, vec1);

  // Calculate the angle between the vectors
  const angle = vec1.angleTo(vec2);

  // Get the bone for this joint
  const bone = skeleton.getBoneByName(`${getBoneName(index1)}`);
  if (!bone) return;

  // Apply rotation based on the angle between segments
  // The rotation is primarily around the X axis for finger bending
  const targetRotation = Math.min(Math.PI * 0.9, angle);

  // Apply rotation with smoothing
  bone.rotation.x = THREE.MathUtils.lerp(
    bone.rotation.x,
    targetRotation,
    lerpFactor
  );

  // Add a small amount of side-to-side rotation based on the cross product
  if (index1 === 5 || index1 === 9 || index1 === 13 || index1 === 17) {
    // Only apply to MCP joints (base of fingers)
    const sideRotation = vecOrth.y * 0.3;
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, sideRotation, 0.5);
  }
}
