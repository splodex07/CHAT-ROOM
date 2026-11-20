
import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

setBaseUrl('https://chat-room-9aup.onrender.com');

createRoot(document.getElementById('root')!).render(<App />);
