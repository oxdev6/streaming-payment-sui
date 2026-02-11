// Vite injects `import.meta.env` at build time; we keep the typings loose here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};

export const SUI_CHAIN: `${string}:${string}` =
  env.VITE_SUI_CHAIN ?? 'sui:testnet';

export const SUI_STREAM_PACKAGE_ID: string =
  env.VITE_SUI_STREAM_PACKAGE_ID ?? '';

export const SUI_STREAM_MODULE: string =
  env.VITE_SUI_STREAM_MODULE ?? 'stream';

// Global Clock object on Sui (testnet/mainnet use 0x6 by default)
export const SUI_CLOCK_OBJECT_ID: string =
  env.VITE_SUI_CLOCK_OBJECT_ID ?? '0x6';

// Known coin types (Sui framework)
export const TOKEN_COIN_TYPES = {
  SUI: '0x2::sui::SUI',
} as const;

