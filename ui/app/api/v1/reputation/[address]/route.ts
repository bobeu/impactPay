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
    query GetReputation($id: ID!) {
      donor(id: $id) {
        reputation
      }
      requester(id: $id) {
        reputation
      }
      higherScoreDonors: donors(where: { reputation_gt: 0 }, first: 1000) {
        reputation
      }
    }
  `;

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: address } }),
    });

    const json = await response.json();
    
    if (json.errors) {
      return NextResponse.json({ error: 'Failed to fetch reputation data' }, { status: 500 });
    }

    const donor = json.data.donor;
    const score = donor ? parseInt(donor.reputation) : 0;
    
    // In a real subgraph, we'd use a count query if supported or a specific ranking entity.
    // Here we approximate rank by seeing how many in the top 1000 have a higher score.
    const higherScores = json.data.higherScoreDonors || [];
    const rank = higherScores.filter((d: any) => parseInt(d.reputation) > score).length + 1;
    const totalCount = higherScores.length || 1;
    const percentile = ((totalCount - rank + 1) / totalCount) * 100;

    let impactCategory = 'Newbie';
    if (score > 10000) impactCategory = 'Whale';
    else if (score > 1000) impactCategory = 'Supporter';

    return NextResponse.json({
      score,
      globalRank: rank,
      percentileRank: parseFloat(percentile.toFixed(2)),
      impactCategory
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
