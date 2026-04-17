import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const subgraphUrl = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT;
  
  if (!subgraphUrl) {
    return NextResponse.json({ error: 'Subgraph endpoint not configured' }, { status: 500 });
  }

  const query = `
    {
      donors(first: 50, orderBy: reputation, orderDirection: desc) {
        id
        totalDonated
        successfulGoalsSupported
        reputation
      }
      requesters(first: 50, orderBy: reputation, orderDirection: desc) {
        id
        completedGoals
        unmetProofs
        flaggedGoals
        reputation
      }
    }
  `;

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    const json = await response.json();
    
    if (json.errors) {
      console.error("Subgraph execution error", json.errors);
      return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
    }

    return NextResponse.json({
      donors: json.data.donors,
      requesters: json.data.requesters
    }, { status: 200 });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
