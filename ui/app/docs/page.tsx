import React from 'react';
import { ShieldCheck, Code, Globe, Zap, Server } from 'lucide-react';

export default function DocsPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/reputation/[address]',
      description: 'Fetch the reputation score, rank, and category for a specific Celo address.',
      response: `{
  "score": 1250,
  "globalRank": 42,
  "percentileRank": 98.4,
  "impactCategory": "Supporter"
}`
    },
    {
      method: 'GET',
      path: '/api/v1/leaderboard',
      description: 'Retrieve the top 100 donors ranked by impact reputation.',
      response: `[
  { "id": "0x123...", "reputation": "5000", "totalDonated": "500" },
  { "id": "0x456...", "reputation": "4200", "totalDonated": "420" }
]`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-primary p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-accent" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-primary">ImpactPay Public API Documentation</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-12">
            The ImpactPay API provides verified social impact data and reputation scores for the Celo ecosystem. 
            Designed for sponsors, DApps, and grant platforms to identify high-impact contributors.
          </p>

          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-2 mb-4">
                 <Server className="w-5 h-5 text-primary" />
                 <h2 className="text-xl font-bold text-primary m-0">Protocol Endpoints</h2>
              </div>
              
              <div className="space-y-8">
                {endpoints.map((endpoint, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-1 rounded border border-accent/20">{endpoint.method}</span>
                          <code className="text-primary font-bold">{endpoint.path}</code>
                       </div>
                    </div>
                    <div className="p-5 space-y-4">
                       <p className="text-sm text-slate-600">{endpoint.description}</p>
                       <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Example Response</span>
                          <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto ring-1 ring-white/10">
                             {endpoint.response}
                          </pre>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
               <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-accent" />
                  Integration Guide
               </h3>
               <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  <p>
                     <strong>1. Identity Verification:</strong> Use the `reputation` endpoint to check if a user is Level 3 verified before awarding grants or governance rights.
                  </p>
                  <p>
                     <strong>2. Social Shifting:</strong> Embed `https://impactpay.protocol/verify/[handle]` in user profiles across your platform to display portable trust reports.
                  </p>
                  <p>
                     <strong>3. Caching:</strong> All API responses are cached for 60 seconds. For real-time on-chain data, please use our Subgraph directly at `api.thegraph.com/subgraphs/name/impactpay`.
                  </p>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
