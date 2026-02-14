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

// Known coin types
export const TOKEN_COIN_TYPES = {
  SUI: '0x2::sui::SUI',
  USDC_TESTNET: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  USDC_MAINNET: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
} as const;

/** Resolve USDC coin type for current chain */
export const getUSDCCoinType = (): string =>
  SUI_CHAIN === 'sui:mainnet' ? TOKEN_COIN_TYPES.USDC_MAINNET : TOKEN_COIN_TYPES.USDC_TESTNET;

// Explorer tx URL helper (append ?network=testnet for testnet)
export const getExplorerTxUrl = (digest: string): string =>
  SUI_CHAIN === 'sui:mainnet'
    ? `https://suiexplorer.com/txblock/${digest}?network=mainnet`
    : `https://suiexplorer.com/txblock/${digest}?network=testnet`;

export const getExplorerObjectUrl = (objectId: string): string =>
  SUI_CHAIN === 'sui:mainnet'
    ? `https://suiexplorer.com/object/${objectId}?network=mainnet`
    : `https://suiexplorer.com/object/${objectId}?network=testnet`;

export const NETWORK_LABEL = SUI_CHAIN === 'sui:mainnet' ? 'Mainnet' : 'Testnet';

// Move error codes (stream.move) → user-facing messages
export const MOVE_ERROR_MESSAGES: Record<number, string> = {
  1: 'Invalid duration: end time must be after start time',
  2: 'Invalid amount: must be greater than zero',
  3: 'Only the recipient can claim from this stream',
  4: 'Nothing to claim yet — wait for more vesting',
  5: 'Only the sender can cancel this stream',
  6: 'Invalid cliff: must be between start and end time',
  7: 'Stream not fully withdrawn yet',
  8: 'Stream has remaining balance',
  9: 'Invalid batch: recipients and amounts must have same length',
  10: 'Invalid batch: amount sum must equal coin value',
};

/** Parse Move abort code from error and return user-friendly message */
export function getMoveErrorMessage(error: unknown, fallback: string): string {
  const msg = String(error ?? '');
  // Sui errors may contain "with code N" or "1" or similar patterns
  const codeMatch = msg.match(/with code (\d+)/i) || msg.match(/\b(?:E)?(\d{1,2})\b/);
  const code = codeMatch ? parseInt(codeMatch[1], 10) : null;
  if (code != null && MOVE_ERROR_MESSAGES[code]) {
    return MOVE_ERROR_MESSAGES[code];
  }
  return fallback;
}

export const MIN_DURATION_SECONDS = 10;

