import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './src/pages/Landing';
import Login from './src/pages/Login';
import TeacherDashboard from './src/pages/TeacherDashboard';
import Legal from './src/pages/Legal';
import ParentalConsent from './src/pages/ParentalConsent';
import Changelog from './src/pages/Changelog';
import Blog from './src/pages/Blog';

import StudentCheckIn from './src/pages/StudentCheckIn';
import StudentDashboard from './src/pages/StudentDashboard';
import MobileAuthCallback from './src/pages/MobileAuthCallback';

const App = () => {
  return (
    <Router>
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
    </Router>
  );
};

export default App;