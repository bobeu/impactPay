import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getHandleByAddress } from '@/lib/socialconnect-store';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  
  // Fetch stats from our own API
  const statsUrl = `${protocol}://${host}/api/v1/reputation/${address}`;
  
  let score = 0;
  let globalRank = 0;
  let impactCategory = 'Newbie';
  
  try {
    const res = await fetch(statsUrl);
    if (res.ok) {
      const data = await res.json();
      score = data.score || 0;
      globalRank = data.globalRank || 0;
      impactCategory = data.impactCategory || 'Newbie';
    }
  } catch (err) {
    console.error("OG Stats Fetch Error:", err);
  }

  const handle = getHandleByAddress(address);
  const displayName = handle ? `@${handle}` : `${address.slice(0, 6)}...${address.slice(-4)}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#001B3D',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, color: '#10B981', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 12 }}>IMPACTPAY PROTOCOL</span>
            <span style={{ fontSize: 64, color: 'white', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Proof of Impact
            </span>
          </div>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px 32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{displayName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 'auto', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '32px', flex: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verifiable Score</span>
            <span style={{ fontSize: 72, color: 'white', fontWeight: 800, marginTop: 16 }}>{score}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '32px', flex: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global Ranking</span>
            <span style={{ fontSize: 72, color: 'white', fontWeight: 800, marginTop: 16 }}>#{globalRank}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '40px', borderRadius: '32px', flex: 1, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: 18, color: '#10B981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verification</span>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 32, color: 'white', fontWeight: 800 }}>LVL 3</span>
              <div style={{ 
                display: 'flex', 
                marginLeft: 16, 
                backgroundColor: '#10B981', 
                borderRadius: '12px', 
                width: 48, 
                height: 48, 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20, color: '#64748B' }}>Verified Impact on Celo Network</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10B981' }}></div>
            <span style={{ fontSize: 18, color: '#10B981', fontWeight: 600 }}>SECURE & AUDITABLE</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
