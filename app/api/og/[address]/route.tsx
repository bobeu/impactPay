import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  // Ideally fetch from our api/v1/stats or Subgraph
  // As this is an Edge endpoint, we just mock some values or fetch.
  // For the sake of this dynamic image, let's fetch the local stats route we just built.
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const apiUrl = `${protocol}://${host}/api/v1/stats/user/${address}`;

  let donorScore = "0";
  let impactCategory = "Newbie";
  let totalFunded = "0";

  try {
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      donorScore = (data.donorScore || 0).toString();
      impactCategory = data.impactCategory || "Newbie";
      totalFunded = data.totalFunded || "0";
    }
  } catch (err) {
    console.error("Failed to fetch user stats for OG image", err);
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: 60, fontWeight: 'bold', color: '#1E293B' }}>ImpactPay</span>
            <span style={{ fontSize: 30, marginLeft: 20, color: '#35D07F' }}>Celo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #35D07F', padding: '40px', borderRadius: '16px' }}>
            <h1 style={{ fontSize: 48, margin: 0, color: '#1E293B' }}>{shortAddress}</h1>
            <div style={{ display: 'flex', background: '#35D07F', color: 'white', padding: '8px 16px', borderRadius: '24px', fontSize: 24, marginTop: '16px' }}>
              Level 3 Verified ✓
            </div>
            <div style={{ display: 'flex', marginTop: '40px', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#64748B' }}>Impact Score</span>
                <span style={{ fontSize: 40, color: '#1E293B', fontWeight: 'bold' }}>{donorScore}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#64748B' }}>Category</span>
                <span style={{ fontSize: 40, color: '#1E293B', fontWeight: 'bold' }}>{impactCategory}</span>
              </div>
            </div>
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
