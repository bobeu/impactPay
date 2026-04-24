"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // For SPA behavior, if someone hits a 404 on a static host, 
    // we want to redirect them back to the main app which can handle the route.
    router.replace('/');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">🧩</span>
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Navigation Check</h1>
      <p className="text-sm text-slate-500 font-medium">Redirecting you to the Impact Dashboard...</p>
    </div>
  );
}
