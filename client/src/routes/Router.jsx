import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth, Dashboard, ContentLibrary, Quizzes, Progress, Admin } from '../pages';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<ContentLibrary />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;