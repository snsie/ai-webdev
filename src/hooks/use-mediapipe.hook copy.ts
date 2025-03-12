import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import createTfjsWorker from '@/utils/create-tfjs-worker';
import webcamSetup from '@/webcam/webcam-setup';
import WebcamStream from '@/webcam/webcam';
// import webcamDraw from '@/webcam/webcam-draw';
// import { drawWaitTime, imageHeight, imageWidth } from '@/webcam/webcam-params';
import { numKeypoints3d } from '@/utils/store';
import * as mpHands from '@mediapipe/hands';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const config = {
  locateFile: (file: string) => {
    // console.log(
    //   `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
    // );
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
  },
};
const globalPosJoint = 0;
const point2 = 17;
const point3 = 2;
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
  // const model = handPoseDetection.SupportedModels.MediaPipeHands;

  const basePosRightRef = useRef([0, 0, 0]);
  const basePosLeftRef = useRef([0, 0, 0]);
  const keypointsRightRef = useRef(new Float32Array(numKeypoints3d));
  const keypointsLeftRef = useRef(new Float32Array(numKeypoints3d));
  const handLabelRefs = useRef(handLabels);
  const handLandmarker = useMemo(async () => {
    const handLandmarker = await createHandLandmarker();
    console.log();
    return handLandmarker;
  }, []);

  const hands = useMemo(() => {
    // console.log((dpr * widthScale) / heightScale);
    // console.log(dpr);
    const hands = new mpHands.Hands(config);
    hands.setOptions({
      selfieMode: true,
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });
    function onResults(results) {
      // multiHandWorldLandmarks
      // console.log(results.multiHandLandmarks.length);
      const detectedHandLabels = { ...handLabels };

      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const keypointsArray3d: number[] = [];
        detectedHandLabels[results.multiHandedness[i].label] = true;

        for (let j = 0; j < results.multiHandLandmarks[i].length; j++) {
          keypointsArray3d.push(
            results.multiHandWorldLandmarks[i][j].x,
            -results.multiHandWorldLandmarks[i][j].y,
            results.multiHandWorldLandmarks[i][j].z
          );
        }
        // console.log(results.multiHandWorldLandmarks[0][17].y);

        // console.log(results);

        if (results.multiHandedness[i].label === 'Right') {
          const currentBasePos = [
            -0.5 + results.multiHandLandmarks[i][globalPosJoint].x,
            0.6 - results.multiHandLandmarks[i][globalPosJoint].y,
            -results.multiHandLandmarks[i][globalPosJoint].z,
          ];

          basePosRightRef.current.forEach(
            (val, index) =>
              (basePosRightRef.current[index] =
                currentBasePos[index] * updateGamma + val * (1 - updateGamma))
          );
          keypointsRightRef.current.forEach(
            (val, index) =>
              (keypointsRightRef.current[index] =
                keypointsArray3d[index] * updateGamma + val * (1 - updateGamma))
          );
        } else {
          const currentBasePos = [
            -0.5 + results.multiHandLandmarks[i][globalPosJoint].x,
            0.6 - results.multiHandLandmarks[i][globalPosJoint].y,
            -results.multiHandLandmarks[i][globalPosJoint].z,
          ];
          basePosLeftRef.current.forEach(
            (val, index) =>
              (basePosLeftRef.current[index] =
                currentBasePos[index] * updateGamma + val * (1 - updateGamma))
          );
          keypointsLeftRef.current.forEach(
            (val, index) =>
              (keypointsLeftRef.current[index] =
                keypointsArray3d[index] * updateGamma + val * (1 - updateGamma))
          );
        }
      }
      handLabelRefs.current = { ...detectedHandLabels };
    }
    hands.onResults(onResults);
    return hands;
  }, []);

  const webcamRef = useRef<HTMLVideoElement>(null!);
  useEffect(() => {
    let rafId;
    webcamSetup().then((val) => (webcamRef.current = val));
    async function renderVideo() {
      if (webcamRef.current) {
        handLandmarker.estimateHands(webcamRef.current);
        // webcamRef.current.drawCtx();
        await hands.send({ image: webcamRef.current });
        // webcamRef.current.clearCtx();
      }
      rafId = requestAnimationFrame(renderVideo);
    }

    rafId = requestAnimationFrame(renderVideo);
    const cleanupWebCam = () => {
      cancelAnimationFrame(rafId);
    };

    // console.log(hands);

    return () => {
      cleanupWebCam();
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
