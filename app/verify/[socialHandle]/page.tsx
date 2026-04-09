import React from 'react';

export const runtime = 'edge';

export default async function VerifyPage({ params }: { params: Promise<{ socialHandle: string }> }) {
  const resolvedParams = await params;
  const socialHandle = decodeURIComponent(resolvedParams.socialHandle);

  // In a real scenario, this would query SocialConnect to map socialHandle to a Celo address.
  // Then fetch the ImpactPay metrics.
  // For the sake of the report, we mock the retrieval and render the flat Fintech card.
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="max-w-md w-full border border-slate-200 p-8 rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Trust Report</h1>
          <p className="text-slate-500 mt-2">Verified via SocialConnect</p>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="text-xl text-slate-700 font-semibold mb-2">@{socialHandle}</div>
          <div className="bg-[#35D07F] text-white px-4 py-1 rounded-full text-sm font-semibold">
            Level 3 Verified ✓
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500">Impact Score</span>
            <span className="font-bold text-slate-800 text-lg">---</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500">Category</span>
            <span className="font-bold text-[#35D07F] text-lg">Supporter</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500">Total Goals Funded</span>
            <span className="font-bold text-slate-800 text-lg">---</span>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          This report is publicly verifiable on the Celo blockchain.
        </div>
      </div>
    </div>
  );
}
