type RetryPayload = {
  goalId: number;
  billerCategory: "airtime" | "data" | "electricity";
  providerCode: string;
  customerReference: string;
  amount: number;
  feeCurrency?: `0x${string}`;
};

const g = globalThis as unknown as {
  __impactPayRetries?: Map<string, RetryPayload>;
};

if (!g.__impactPayRetries) {
  g.__impactPayRetries = new Map<string, RetryPayload>();
}

export const retryStore = g.__impactPayRetries;
export type { RetryPayload };

