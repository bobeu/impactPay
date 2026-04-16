import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const subgraphUrl = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT;
  
  if (!subgraphUrl) {
    return NextResponse.json({ error: 'Subgraph endpoint not configured' }, { status: 500 });
  }

  const query = `
    {
      donors(first: 100, orderBy: reputation, orderDirection: desc) {
        id
        reputation
        totalDonated
      }
    }
  `;

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    
    if (json.errors) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
    }

    return NextResponse.json(json.data.donors, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
