//from: https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection/demos/live_video

/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;

export const imageWidth = 640;
export const imageHeight = 480;

export const pixelBufferLength = 4 * imageWidth * imageHeight;

const targetFps = 30;
export const drawWaitTime = 1000 / targetFps;
// export const STATE = {
//   camera: { targetFPS: targetFps, sizeOption: '360 X 270' },
//   backend: 'tfjs-webgl',
//   runtime: 'tfjs' as 'tfjs',
//   flags: {},
//   modelConfig: {} as any,
//   model: 'MediaPipeHands',
// };
export const MEDIAPIPE_HANDS_CONFIG = {
  type: 'full', // or lite
  render3D: true,
};
export const fingerLookupIndices = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// export const TUNABLE_FLAG_VALUE_RANGE_MAP = {
//   WEBGL_VERSION: [1, 2],
//   WASM_HAS_SIMD_SUPPORT: [true, false],
//   WASM_HAS_MULTITHREAD_SUPPORT: [true, false],
//   WEBGL_CPU_FORWARD: [true, false],
//   WEBGL_PACK: [true, false],
//   WEBGL_FORCE_F16_TEXTURES: [true, false],
//   WEBGL_RENDER_FLOAT32_CAPABLE: [true, false],
//   WEBGL_FLUSH_THRESHOLD: [-1, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
//   CHECK_COMPUTATION_FOR_ERRORS: [true, false],
// };
export const videoConfig = {
  audio: false,
  video: {
    // facingMode: 'user',
    // Only setting the video to a specified size for large screen, on
    // mobile devices accept the default size.
    width: imageWidth,
    height: imageHeight,
    frameRate: {
      ideal: targetFps,
    },
  },
};
