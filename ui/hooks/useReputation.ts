"use client";

import { useEffect, useState } from "react";

type ReputationData = {
  score: number;
  globalRank: number;
  percentileRank: number;
  impactCategory: string;
};

export function useReputation(address?: string) {
  const [data, setData] = useState<ReputationData>({
    score: 0,
    globalRank: 0,
    percentileRank: 0,
    impactCategory: "Newbie",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    setLoading(true);
    setError(null);

    fetch(`/api/v1/reputation/${address.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reputation");
        return res.json();
      })
      .then((json) => {
        setData({
          score: json.score || 0,
          globalRank: json.globalRank || 0,
          percentileRank: json.percentileRank || 0,
          impactCategory: json.impactCategory || "Newbie",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}

