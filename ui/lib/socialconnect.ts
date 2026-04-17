export async function registerPhoneMapping(input: {
  phoneNumber: string;
  walletAddress: string;
}) {
  const res = await fetch("/api/socialconnect/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to register phone mapping");
  }
  return res.json();
}

export async function lookupByPhone(phoneNumber: string) {
  const res = await fetch("/api/socialconnect/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to lookup phone");
  }
  return res.json();
}

