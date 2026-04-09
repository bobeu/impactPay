type Mapping = {
  obfuscatedIdentifier: string;
  phoneNumber: string;
  address: string;
  createdAt: number;
};

const globalStore = globalThis as unknown as {
  __impactPayPhoneMappings?: Map<string, Mapping>;
};

if (!globalStore.__impactPayPhoneMappings) {
  globalStore.__impactPayPhoneMappings = new Map<string, Mapping>();
}

export const phoneMappings = globalStore.__impactPayPhoneMappings;

