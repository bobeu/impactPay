type Mapping = {
  obfuscatedIdentifier: string;
  phoneNumber?: string;
  handle?: string;
  address: string;
  createdAt: number;
};

const globalStore = globalThis as unknown as {
  __impactPayPhoneMappings?: Map<string, Mapping>;
  __impactPayHandleMappings?: Map<string, Mapping>;
};

if (!globalStore.__impactPayPhoneMappings) {
  globalStore.__impactPayPhoneMappings = new Map<string, Mapping>();
}
if (!globalStore.__impactPayHandleMappings) {
  globalStore.__impactPayHandleMappings = new Map<string, Mapping>();
}

export const phoneMappings = globalStore.__impactPayPhoneMappings;
export const handleMappings = globalStore.__impactPayHandleMappings;

export function getHandleByAddress(address: string): string | null {
  const addr = address.toLowerCase();
  for (const mapping of Array.from(handleMappings.values())) {
    if (mapping.address.toLowerCase() === addr) return mapping.handle || null;
  }
  return null;
}

export function getPhoneByAddress(address: string): string | null {
  const addr = address.toLowerCase();
  for (const mapping of Array.from(phoneMappings.values())) {
    if (mapping.address.toLowerCase() === addr) return mapping.phoneNumber || null;
  }
  return null;
}

