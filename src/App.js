import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getSession } from './utils/session';
import SignIn from './pages/SignIn';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import './index.css';

function AuthGuard({ children }) {
  const session = getSession();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children(session);
}

function HomePage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const authError = params.get('auth_error');
  const session = getSession();
  if (session) return <Navigate to="/dashboard" replace />;
  return <SignIn error={authError} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              {(session) => <Dashboard session={session} />}
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
