"use client";

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load views for better performance
const HomeView = lazy(() => import('@/views/HomeView'));
const FunderDashboardView = lazy(() => import('@/views/FunderDashboardView'));
const ProfileView = lazy(() => import('@/views/ProfileView'));
const SponsorView = lazy(() => import('@/views/SponsorView'));
const CreateGoalView = lazy(() => import('@/views/CreateGoalView'));
const ReputationView = lazy(() => import('@/views/ReputationView'));
const VerifyView = lazy(() => import('@/views/VerifyView'));

export function AppRouter() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/funder" element={<FunderDashboardView />} />
        <Route path="/profile/:address" element={<ProfileView />} />
        <Route path="/sponsor" element={<SponsorView />} />
        <Route path="/create-goal" element={<CreateGoalView />} />
        <Route path="/reputation" element={<ReputationView />} />
        <Route path="/verify/:handle" element={<VerifyView />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
