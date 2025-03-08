// import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
import App from './components/app';

import { createRoot } from 'react-dom/client';

const rootNode = document.getElementById('root') as HTMLElement;
const root = createRoot(rootNode);
root.render(<App />);
