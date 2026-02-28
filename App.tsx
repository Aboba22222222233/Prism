import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy-loaded pages — each page is downloaded only when the user navigates to it
const Landing = lazy(() => import('./src/pages/Landing'));
const Login = lazy(() => import('./src/pages/Login'));
const TeacherDashboard = lazy(() => import('./src/pages/TeacherDashboard'));
const Legal = lazy(() => import('./src/pages/Legal'));
const ParentalConsent = lazy(() => import('./src/pages/ParentalConsent'));
const Changelog = lazy(() => import('./src/pages/Changelog'));
const Blog = lazy(() => import('./src/pages/Blog'));
const StudentCheckIn = lazy(() => import('./src/pages/StudentCheckIn'));
const StudentDashboard = lazy(() => import('./src/pages/StudentDashboard'));
const MobileAuthCallback = lazy(() => import('./src/pages/MobileAuthCallback'));

// Loading fallback shown while page chunks are being downloaded
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a1a',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid rgba(139, 92, 246, 0.3)',
      borderTopColor: '#8b5cf6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/checkin" element={<StudentCheckIn />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/parental-consent" element={<ParentalConsent />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/auth/mobile-callback" element={<MobileAuthCallback />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;