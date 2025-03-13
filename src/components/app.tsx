import { Suspense, useRef, useState } from 'react';
import '@/styles/app.css';

// import ButtonAppBar from './components/app-bar';
import { ThemeProvider } from '@mui/material/styles';
// import { StyledEngineProvider } from '@mui/material/styles';
// import TaskTitle from './components/task-title/task-title';
import themeColors from '@/utils/theme-colors';
import AppCanvas from '@/components/canvas/app-canvas';
import AppDom from './dom/app-dom';
// import useTfjsWorkerHook from '@/hooks/use-tfjs-worker.hook';
import '../test';
import useMediapipeHook from '@/hooks/use-mediapipe.hook';
// import testSupport from '@/utils/test-support';
// import MediapipeHands from '../test';
// import MediapipeHands from '@/test';
const App = () => {
  // testSupport([{ client: 'Chrome' }]);
  // const basePosRef = useRef([1, 0, 0, 0]);
  const handRefs = useMediapipeHook();
  // const [quaternionRef, keypointsRef] = useTfjsWorkerHook();
  return (
    <ThemeProvider theme={themeColors}>
      <div className="App">
        {/* {Math.random()} */}
        {/* <ButtonAppBar taskCallback={setSelectedIndex} /> */}
        <AppCanvas handRefs={handRefs} />

        <AppDom />
        {/* <canvas
          className="output_canvas"
          id="output_canvas"
          style={{ position: 'absolute', left: '0px', top: '0px' }}
        >
          {/*  */}
        {/*</canvas> */}
        {/* <MediapipeHands /> */}
      </div>
    </ThemeProvider>
  );
};

export default App;
