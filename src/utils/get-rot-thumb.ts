import * as THREE from 'three';
import getBoneName from '@/utils/get-bone-name';

const quatWristInverted = new THREE.Quaternion();
const vec1 = new THREE.Vector3();
const vec2 = new THREE.Vector3();
const vecOrth = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const axis = new THREE.Vector3();

export default function getRotThumb(skeleton, keypointsArray, indexBot) {
  // Get the wrist quaternion and invert it
  quatWristInverted.copy(skeleton.bones[0].quaternion).invert();

  // Process the CMC joint (base of thumb)
  processThumbJoint(skeleton, keypointsArray, 0, indexBot, indexBot + 1, 0.8);

  // Process the MCP joint (middle joint of thumb)
  processThumbJoint(
    skeleton,
    keypointsArray,
    indexBot,
    indexBot + 1,
    indexBot + 2,
    0.9
  );

  // Process the IP joint (tip joint of thumb)
  processThumbJoint(
    skeleton,
    keypointsArray,
    indexBot + 1,
    indexBot + 2,
    indexBot + 3,
    0.9
  );
}

// Helper function to process a thumb joint
function processThumbJoint(
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
  vecOrth.crossVectors(vec2, vec1).normalize();

  // Calculate the angle between the vectors
  const angle = vec1.angleTo(vec2);

  // Get the bone for this joint
  const bone = skeleton.getBoneByName(`${getBoneName(index1)}`);
  if (!bone) return;

  // For the CMC joint (base of thumb), we need special handling
  console.log(index1);
  const indexBot = 1;
  if (index1 === indexBot) {
    // CMC joint needs rotation around multiple axes
    const indexBase = 5; // Index finger MCP joint
    const thumbTip = 4; // Thumb tip

    // Calculate vector from thumb CMC to index MCP for opposition
    const oppositionVec = new THREE.Vector3(
      keypointsArray[indexBase * 3 + 0] - keypointsArray[index1 * 3 + 0],
      keypointsArray[indexBase * 3 + 1] - keypointsArray[index1 * 3 + 1],
      keypointsArray[indexBase * 3 + 2] - keypointsArray[index1 * 3 + 2]
    ).normalize();

    // Calculate vector from thumb tip to thumb CMC
    const thumbVec = new THREE.Vector3(
      keypointsArray[thumbTip * 3 + 0] - keypointsArray[index1 * 3 + 0],
      keypointsArray[thumbTip * 3 + 1] - keypointsArray[index1 * 3 + 1],
      keypointsArray[thumbTip * 3 + 2] - keypointsArray[index1 * 3 + 2]
    ).normalize();

    // Calculate opposition angle
    const oppositionAngle = oppositionVec.angleTo(thumbVec);

    // Create quaternion for rotation
    quaternion.setFromAxisAngle(vecOrth, angle);

    // Apply rotations for thumb CMC with better anatomical constraints
    bone.rotation.x = THREE.MathUtils.lerp(
      bone.rotation.x,
      Math.min(Math.PI * 0.4, angle * 0.8),
      lerpFactor
    );

    bone.rotation.y = THREE.MathUtils.lerp(
      bone.rotation.y,
      Math.min(Math.PI * 0.25, oppositionAngle * 0.8),
      lerpFactor
    );

    bone.rotation.z = THREE.MathUtils.lerp(
      bone.rotation.z,
      Math.min(Math.PI * 0.2, oppositionAngle * 0.5),
      lerpFactor
    );
  } else if (index1 === indexBot + 1) {
    // MCP joint (middle joint of thumb)
    bone.rotation.x = THREE.MathUtils.lerp(
      bone.rotation.x,
      Math.min(Math.PI * 0.5, angle * 0.9),
      lerpFactor
    );

    // Add slight adduction/abduction
    bone.rotation.y = THREE.MathUtils.lerp(
      bone.rotation.y,
      vecOrth.z * 0.1,
      0.3
    );

    bone.rotation.z = THREE.MathUtils.lerp(
      bone.rotation.z,
      vecOrth.y * 0.1,
      0.3
    );
  } else {
    // IP joint (tip joint of thumb)
    bone.rotation.x = THREE.MathUtils.lerp(
      bone.rotation.x,
      Math.min(Math.PI * 0.6, angle),
      lerpFactor
    );

    // Minimal side-to-side movement for the tip joint
    bone.rotation.z = THREE.MathUtils.lerp(
      bone.rotation.z,
      vecOrth.y * 0.05,
      0.2
    );
  }
}
