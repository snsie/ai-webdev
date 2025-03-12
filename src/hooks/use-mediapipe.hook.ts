import { useEffect, useMemo, useRef } from 'react';
import webcamSetup from '@/webcam/webcam-setup';
import { numKeypoints3d } from '@/utils/store';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const globalPosJoint = 0;
const updateGamma = 0.2;
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });
  return handLandmarker;
};
const handLabels = { Left: false, Right: false };
export default function useMediapipeHook() {
  const basePosRightRef = useRef([0, 0, 0]);
  const basePosLeftRef = useRef([0, 0, 0]);
  const keypointsRightRef = useRef(new Float32Array(numKeypoints3d));
  const keypointsLeftRef = useRef(new Float32Array(numKeypoints3d));
  const handLabelRefs = useRef(handLabels);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const webcamRef = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    let rafId: number;
    let isHandLandmarkerReady = false;

    const setupHandLandmarker = async () => {
      handLandmarkerRef.current = await createHandLandmarker();
      isHandLandmarkerReady = true;
    };

    setupHandLandmarker();
    webcamSetup().then((val) => (webcamRef.current = val));

    async function renderVideo() {
      if (
        webcamRef.current &&
        isHandLandmarkerReady &&
        handLandmarkerRef.current
      ) {
        const video = webcamRef.current;
        const videoTime = video.currentTime;

        // Only run hand detection when the video frame has changed
        if (videoTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoTime;

          const results = handLandmarkerRef.current.detectForVideo(
            video,
            videoTime * 1000
          );
          console.log(results);
          if (results.landmarks && results.handedness) {
            const detectedHandLabels = { ...handLabels };

            for (let i = 0; i < results.landmarks.length; i++) {
              const keypointsArray3d: number[] = [];
              const handedness = results.handedness[i];
              // Flip the handedness: Left becomes Right and vice versa
              const originalHandLabel = handedness[0].categoryName;
              const handLabel = originalHandLabel === 'Left' ? 'Right' : 'Left';
              console.log(handLabel);
              detectedHandLabels[handLabel] = true;

              for (let j = 0; j < results.landmarks[i].length; j++) {
                const landmark = results.landmarks[i][j];
                // Invert the x-axis by using 1-landmark.x instead of landmark.x
                keypointsArray3d.push(1 - landmark.x, -landmark.y, landmark.z);
              }

              if (handLabel === 'Right') {
                const currentBasePos = [
                  0.5 - results.landmarks[i][globalPosJoint].x, // Invert x-axis for base position
                  0.6 - results.landmarks[i][globalPosJoint].y,
                  -results.landmarks[i][globalPosJoint].z,
                ];

                basePosRightRef.current.forEach(
                  (val, index) =>
                    (basePosRightRef.current[index] =
                      currentBasePos[index] * updateGamma +
                      val * (1 - updateGamma))
                );
                keypointsRightRef.current.forEach(
                  (val, index) =>
                    (keypointsRightRef.current[index] =
                      keypointsArray3d[index] * updateGamma +
                      val * (1 - updateGamma))
                );
              } else {
                const currentBasePos = [
                  0.5 - results.landmarks[i][globalPosJoint].x, // Invert x-axis for base position
                  0.6 - results.landmarks[i][globalPosJoint].y,
                  -results.landmarks[i][globalPosJoint].z,
                ];
                basePosLeftRef.current.forEach(
                  (val, index) =>
                    (basePosLeftRef.current[index] =
                      currentBasePos[index] * updateGamma +
                      val * (1 - updateGamma))
                );
                keypointsLeftRef.current.forEach(
                  (val, index) =>
                    (keypointsLeftRef.current[index] =
                      keypointsArray3d[index] * updateGamma +
                      val * (1 - updateGamma))
                );
              }
            }
            handLabelRefs.current = { ...detectedHandLabels };
          }
        }
      }
      rafId = requestAnimationFrame(renderVideo);
    }

    rafId = requestAnimationFrame(renderVideo);

    return () => {
      cancelAnimationFrame(rafId);
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  return [
    handLabelRefs,
    basePosRightRef,
    keypointsRightRef,
    basePosLeftRef,
    keypointsLeftRef,
  ];
}
