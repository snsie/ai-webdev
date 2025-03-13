import { Suspense } from 'react';
import WaitSpinner from '@/components/dom/wait-spinner/wait-spinner';
import HandTask from '@/components/dom/hand/hand';
import styles from '@/styles/app-dom.styles.module.css';
export default function AppDom() {
  return (
    <div className={styles.appDom}>
      {/* <h4>
        Please watch{' '}
        <a
          href="https://www.youtube.com/watch?v=bxe2T-V8XRs&list=PLiaHhY2iBX9hdHaRr6b7XevZtgZRa1PoU&index=1&ab_channel=WelchLabs"
          target="_blank"
          rel="noopener noreferrer"
        >
          this
        </a>{' '}
        series on neural networks
      </h4>
      <h4>
        Please read the first four chapters of{' '}
        <a
          href="https://automatetheboringstuff.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          this
        </a>{' '}
        introduction to python
      </h4> */}
      {/* <TaskTitle titleIndex={selectedIndex} /> */}
      <h1>Display your palms to your webcam!</h1>
      <Suspense fallback={<WaitSpinner />}>
        <HandTask />
      </Suspense>
      {/* <h3>Gamification Coming Soon!</h3> */}
    </div>
  );
}
