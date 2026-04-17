import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type CardRecord = {
  goalId: number;
  owner: string;
  encryptedPayload: string;
  iv: string;
  webhookStatus: "pending" | "issued" | "failed";
  createdAt: number;
};

const g = globalThis as unknown as { __impactPayCards?: Map<number, CardRecord> };
if (!g.__impactPayCards) g.__impactPayCards = new Map<number, CardRecord>();

function key() {
  const secret = process.env.CARD_ENCRYPTION_KEY || "local-dev-card-key";
  return createHash("sha256").update(secret).digest();
}

export function storeCard(goalId: number, owner: string, payload: unknown) {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]).toString("base64");

  g.__impactPayCards!.set(goalId, {
    goalId,
    owner: owner.toLowerCase(),
    encryptedPayload: encrypted,
    iv: iv.toString("base64"),
    webhookStatus: "pending",
    createdAt: Date.now(),
  });
}

export function readCard(goalId: number, requester: string) {
  const row = g.__impactPayCards!.get(goalId);
  if (!row) return null;
  if (row.owner !== requester.toLowerCase()) return null;

  const decipher = createDecipheriv(
    "aes-256-cbc",
    key(),
    Buffer.from(row.iv, "base64"),
  );
  const json = Buffer.concat([
    decipher.update(Buffer.from(row.encryptedPayload, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return { ...row, payload: JSON.parse(json) };
}

export function updateCardWebhook(goalId: number, status: "issued" | "failed") {
  const row = g.__impactPayCards!.get(goalId);
  if (!row) return;
  row.webhookStatus = status;
  g.__impactPayCards!.set(goalId, row);
}

