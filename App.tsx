import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './src/pages/Landing';
import Login from './src/pages/Login';
import TeacherDashboard from './src/pages/TeacherDashboard';

import StudentCheckIn from './src/pages/StudentCheckIn';
import StudentDashboard from './src/pages/StudentDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/checkin" element={<StudentCheckIn />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;