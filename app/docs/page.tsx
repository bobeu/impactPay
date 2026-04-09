import React from 'react';

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen text-slate-800">
      <h1 className="text-4xl font-bold mb-4 text-slate-900">ImpactPay Public API</h1>
      <p className="text-lg text-slate-600 mb-8">
        Welcome to the ImpactPay API documentation. Partners like Celo or Binance can query these endpoints to identify high-impact developers or donors.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Endpoints</h2>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 bg-slate-50 px-3 py-2 rounded">
            <span className="text-[#35D07F] border border-[#35D07F] rounded px-2 mr-2 text-sm uppercase">GET</span>
            /api/v1/stats/user/[address]
          </h3>
          <p className="mb-2 text-slate-600">Fetch reputation data for a specific Celo address.</p>
          <pre className="bg-slate-800 text-slate-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "address": "0x...",
  "donorScore": 1200,
  "requesterScore": 500,
  "totalFunded": "10000000000000",
  "goalsCompleted": 5,
  "globalRank": 12,
  "percentile": 0.95,
  "impactCategory": "Whale"
}`}
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 bg-slate-50 px-3 py-2 rounded">
            <span className="text-[#35D07F] border border-[#35D07F] rounded px-2 mr-2 text-sm uppercase">GET</span>
            /api/v1/stats/leaderboard
          </h3>
          <p className="mb-2 text-slate-600">Returns a JSON list of the top 50 donors and requesters, sorted by impact score.</p>
          <pre className="bg-slate-800 text-slate-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "donors": [
    {
      "id": "0x...",
      "totalDonated": "50000000",
      "successfulGoalsSupported": 10,
      "reputation": "1500"
    }
  ],
  "requesters": [...]
}`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Authentication</h2>
        <p className="text-slate-600">
          These endpoints are public and do not require authentication keys for basic lookups. Rate limiting applies to large requests.
        </p>
      </section>
    </div>
  );
}
