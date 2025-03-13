// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import { DrawingUtils } from '@mediapipe/tasks-vision';
import styles from '@/styles/hand.styles.module.css';
interface MediapipeHandsProps {
  onResults?: (results: any) => void;
}

const MediapipeHands: React.FC<MediapipeHandsProps> = ({ onResults }) => {
  const [handLandmarker, setHandLandmarker] = useState<any>(undefined);
  const [runningMode, setRunningMode] = useState<'IMAGE' | 'VIDEO'>('VIDEO');
  const [webcamRunning, setWebcamRunning] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const resultsRef = useRef<any>(undefined);

  // Initialize the hand landmarker
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );
    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: runningMode,
      numHands: 2,
      // selfieMode: true,
    });
    setHandLandmarker(landmarker);
  };

  useEffect(() => {
    createHandLandmarker();
  }, []);
  useEffect(() => {
    createHandLandmarker();
  }, [webcamRunning]);

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      canvasCtxRef.current = canvasRef.current.getContext('2d');
    }
  }, []);

  // Check if webcam access is supported
  const hasGetUserMedia = (): boolean => {
    return !!navigator.mediaDevices?.getUserMedia;
  };

  // Start webcam automatically when component mounts
  useEffect(() => {
    if (hasGetUserMedia()) {
      startWebcam();
    }
  }, []);

  // Start the webcam
  const startWebcam = () => {
    // getUsermedia parameters
    const constraints = {
      video: true,
    };

    // Activate the webcam stream
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setWebcamRunning(true);
            // Start predictions immediately when webcam is ready
            predictWebcam();
          });
        }
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
      });
  };

  const predictWebcam = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !canvasCtxRef.current ||
      !handLandmarker
    ) {
      // If not ready yet, try again on next frame
      await handLandmarker.setOptions({
        runningMode: 'VIDEO',
        selfieMode: true,
      });
      if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
      }
      return;
    }
    // Log which hand is detected (left or right)
    if (handLandmarker && resultsRef.current?.handedness) {
      for (let i = 0; i < resultsRef.current.handedness.length; i++) {
        const handedness = resultsRef.current.handedness[i];
        const handLabel = handedness[0].categoryName; // 'Left' or 'Right'
        const handScore = handedness[0].score; // Confidence score
        console.log(
          `Hand ${i + 1}: ${handLabel} (confidence: ${handScore.toFixed(2)})`
        );
      }
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvasCtxRef.current;

    // Set canvas dimensions
    canvas.style.width = `${video.videoWidth}px`;
    canvas.style.height = `${video.videoHeight}px`;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Switch to video mode if needed
    if (runningMode === 'IMAGE') {
      setRunningMode('VIDEO');
      await handLandmarker.setOptions({
        runningMode: 'VIDEO',
      });
    }

    const startTimeMs = performance.now();
    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;
      resultsRef.current = handLandmarker.detectForVideo(video, startTimeMs);
      if (onResults) {
        onResults(resultsRef.current);
      }
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (resultsRef.current?.landmarks) {
      const drawingUtils = new DrawingUtils(canvasCtx);

      for (const landmarks of resultsRef.current.landmarks) {
        // Draw hand landmarks
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          { color: '#00FF00', lineWidth: 5 }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }
    }

    canvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready
    if (webcamRunning) {
      window.requestAnimationFrame(predictWebcam);
    }
  };

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <video
          id="webcam"
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.handVideo}
          style={{
            width: '100%',
            height: 'auto',
            transform: 'scaleX(-1)',
            objectFit: 'contain',
          }}
        ></video>
        <canvas
          ref={canvasRef}
          className={styles.output_canvas}
          id="output_canvas"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
          }}
        ></canvas>
      </div>

      {!hasGetUserMedia() && (
        <p>getUserMedia() is not supported by your browser</p>
      )}
    </div>
  );
};

export default MediapipeHands;
