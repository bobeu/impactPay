"use client";

import { useEffect, useState } from "react";

type ReputationData = {
  donorReputation: number;
  totalFundedUsd: number;
  requesterReputation: number;
};

export function useReputation(address?: string) {
  const [data, setData] = useState<ReputationData>({
    donorReputation: 0,
    totalFundedUsd: 0,
    requesterReputation: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT;
    if (!address || !endpoint) return;

    setLoading(true);
    setError(null);

    const query = `
      query Reputation($id: ID!) {
        donor(id: $id) {
          reputation
          totalDonated
        }
        requester(id: $id) {
          reputation
        }
      }
    `;

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { id: address.toLowerCase() },
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        const donor = json?.data?.donor;
        const requester = json?.data?.requester;
        setData({
          donorReputation: Number(donor?.reputation ?? 0),
          totalFundedUsd: Number(donor?.totalDonated ?? 0),
          requesterReputation: Number(requester?.reputation ?? 0),
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}

