import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address: asyncAddress } = await params;
  const address = asyncAddress.toLowerCase();
  const subgraphUrl = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT;
  
  if (!subgraphUrl) {
    return NextResponse.json({ error: 'Subgraph endpoint not configured' }, { status: 500 });
  }

  const query = `
    query GetUserStats($id: ID!) {
      donor(id: $id) {
        totalDonated
        reputation
      }
      requester(id: $id) {
        completedGoals
        reputation
      }
      globalStats(where: { id: "1" }) {
        totalDonors
        totalRequesters
      }
    }
  `;

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: address } }),
      next: { revalidate: 60 }
    });

    const json = await response.json();
    
    if (json.errors) {
      console.error("Subgraph execution error", json.errors);
      return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
    }

    const donor = json.data.donor;
    const requester = json.data.requester;
    const globalStat = json.data.globalStats && json.data.globalStats.length > 0 ? json.data.globalStats[0] : null;

    // Approximate rank/percentile
    let donorScore = donor ? parseInt(donor.reputation) : 0;
    
    let stats = {
      address,
      donorScore: donorScore,
      requesterScore: requester ? parseInt(requester.reputation) : 0,
      totalFunded: donor ? donor.totalDonated : "0",
      goalsCompleted: requester ? requester.completedGoals : 0,
      globalRank: 1, // Default, theoretically we could query superior scores 
      percentile: 1.0, 
      impactCategory: 'Newbie'
    };

    if (donorScore > 10000) {
      stats.impactCategory = 'Whale';
    } else if (donorScore > 1000) {
      stats.impactCategory = 'Supporter';
    }

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("User stats fetch error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
