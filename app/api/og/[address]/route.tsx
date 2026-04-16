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
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 28, color: '#10B981', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>ImpactPay Protocol</span>
            <span style={{ fontSize: 60, color: '#001B3D', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Proof of Impact
            </span>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#F8FAFC', padding: '16px 24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#001B3D' }}>{displayName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 'auto', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', padding: '32px', borderRadius: '24px', flex: 1, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 20, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impact Score</span>
            <span style={{ fontSize: 56, color: '#001B3D', fontWeight: 800, marginTop: 12 }}>{score}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', padding: '32px', borderRadius: '24px', flex: 1, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 20, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Rank</span>
            <span style={{ fontSize: 56, color: '#001B3D', fontWeight: 800, marginTop: 12 }}>#{globalRank}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', padding: '32px', borderRadius: '24px', flex: 1, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 20, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification</span>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 32, color: '#10B981', fontWeight: 800 }}>L3 Verified</span>
              <div style={{ display: 'flex', marginLeft: 12, backgroundColor: '#10B981', borderRadius: '50%', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 20 }}>✓</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: '60px', borderTop: '1px solid #E2E8F0', paddingTop: '32px' }}>
          <span style={{ fontSize: 18, color: '#94A3B8' }}>Verified Social Impact powered by Celo SocialConnect</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
