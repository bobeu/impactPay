"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; score: number };

export function useReputationFeed() {
  const [donors, setDonors] = useState<Entry[]>([]);
  const [developers, setDevelopers] = useState<Entry[]>([]);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT;
    if (!endpoint) return;

    const query = `
      query Leaderboard {
        donors(first: 10, orderBy: reputation, orderDirection: desc) { id reputation }
        requesters(first: 10, orderBy: reputation, orderDirection: desc) { id reputation }
      }
    `;

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((json) => {
        setDonors((json?.data?.donors || []).map((x: any) => ({ id: x.id, score: Number(x.reputation) })));
        setDevelopers((json?.data?.requesters || []).map((x: any) => ({ id: x.id, score: Number(x.reputation) })));
      })
      .catch(() => {});
  }, []);

  return { donors, developers };
}

