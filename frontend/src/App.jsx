import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Layout Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <Navbar />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/records" 
            element={
              <ProtectedRoute>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <Navbar />
                  <Records />
                </div>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <Navbar />
                  <Settings />
                </div>
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

