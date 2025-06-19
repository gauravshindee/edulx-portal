import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './css/globals.css';
import App from './App.tsx';
import Spinner from './views/spinner/Spinner.tsx';
import { AuthProvider } from 'src/context/AuthContext'; // ✅ Import AuthProvider
import 'antd/dist/reset.css';

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<Spinner />}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Suspense>
);
