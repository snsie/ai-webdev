import { videoConfig } from './webcam-params';

export default async function webcamSetup() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available'
    );
  }
  // const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
  const video = document.getElementById('video') as HTMLVideoElement;
  // video.style.transform = 'scale(-1, 1)';
  const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = (val) => {
      resolve(val);
    };
  });

  video.play();

  //  const track =  webcam.video.srcObject.getVideoTracks()[0];
  //  const imageCapture = new ImageCapture(track)
  // //  console.log(imageCapture)
  //  imageCapture.grabFrame().then(processFrame,webcam.ctx);

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  // Must set below two lines, otherwise video element doesn't show.
  video.width = videoWidth;
  video.height = videoHeight;

  // webcam.canvas.width = videoWidth;
  // webcam.canvas.height = videoHeight;
  // const canvasContainer = document.getElementById(
  //   'canvasWrapper'
  // ) as HTMLElement;
  // canvasContainer.setAttribute(
  //   'style',
  //   `width: ${videoWidth}px; height: ${videoHeight}px`
  // );

  // Because the image from webcam is mirrored, need to flip horizontally.
  // webcam.ctx.translate(webcam.video.videoWidth, 0);
  // webcam.ctx.scale(-1, 1);

  return video;
}
