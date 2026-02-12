import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  SUI_CHAIN,
  SUI_STREAM_MODULE,
  SUI_STREAM_PACKAGE_ID,
  TOKEN_COIN_TYPES,
  SUI_CLOCK_OBJECT_ID,
  getExplorerTxUrl,
  getExplorerObjectUrl,
  NETWORK_LABEL,
} from "./config.sui";

// ===========================================
// Custom Icons (SVG-based for uniqueness)
// ===========================================

const Icons = {
  stream: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M4 12h16M12 4c-4 4-4 12 0 16M12 4c4 4 4 12 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyan" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="13" r="2" fill="currentColor" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14l4-4 4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan" />
    </svg>
  ),
  claim: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  cancel: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9h8M8 13h6M8 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  payroll: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 11h6M19 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M20 11c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 2L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 2h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ===========================================
// Types
// ===========================================

interface Stream {
  streamId: number;
  recipient: string;
  amount: number;
  withdrawn: number;
  startTime: number;
  endTime: number;
  tokenSymbol: string;
}

// ===========================================
// Helpers
// ===========================================

const formatAddress = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const formatAmount = (amt: number) => (amt / 1_000_000).toFixed(2);

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const formatUSD = (amt: number) => `$${(amt / 1_000_000).toFixed(2)}`;

/** Sui address: 0x + 32–64 hex chars */
const isValidSuiAddress = (addr: string): boolean =>
  /^0x[a-fA-F0-9]{32,64}$/.test(addr.trim());

// ===========================================
// App Component
// ===========================================

export default function App() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePath = !location.pathname || location.pathname === "/";
  const [showIntro, setShowIntro] = useState(isHomePath);

  type PageId = "home" | "payroll" | "grants" | "subscriptions" | "vesting";
  const pathToPage = (path: string): PageId => {
    const p = path.replace(/^\//, "");
    if (p === "payroll" || p === "grants" || p === "subscriptions" || p === "vesting") return p;
    return "home";
  };
  const currentPage = pathToPage(location.pathname);

  const goToPage = (page: PageId) => {
    if (page === "home") navigate("/");
    else navigate(`/${page}`);
  };

  // Page-specific config: labels, presets, copy
  const pageConfig = useMemo(() => {
    const configs: Record<PageId, { recipientLabel: string; amountLabel: string; createBtn: string; durationOptions: { value: string; label: string }[]; emptyTitle: string; emptyHint: string; rateLabel: string }> = {
      home: {
        recipientLabel: "Recipient (Sui address)",
        amountLabel: "Amount",
        createBtn: "Create Stream",
        durationOptions: [
          { value: "30", label: "30s" },
          { value: "60", label: "1m" },
          { value: "120", label: "2m" },
        ],
        emptyTitle: "No streams yet",
        emptyHint: "Create a stream or run a quick demo",
        rateLabel: "Rate",
      },
      payroll: {
        recipientLabel: "Employee (Sui address)",
        amountLabel: "Salary amount",
        createBtn: "Create Payroll Stream",
        durationOptions: [
          { value: "30", label: "30s" },
          { value: "60", label: "1m" },
          { value: "300", label: "5m" },
          { value: "3600", label: "1 hour" },
          { value: "86400", label: "1 day" },
          { value: "604800", label: "1 week" },
        ],
        emptyTitle: "No payroll streams",
        emptyHint: "Start streaming salary to an employee",
        rateLabel: "Pay rate",
      },
      grants: {
        recipientLabel: "Grantee (Sui address)",
        amountLabel: "Grant amount",
        createBtn: "Create Grant Stream",
        durationOptions: [
          { value: "30", label: "30s" },
          { value: "60", label: "1m" },
          { value: "86400", label: "1 day" },
          { value: "604800", label: "1 week" },
          { value: "2592000", label: "30 days" },
        ],
        emptyTitle: "No grant streams",
        emptyHint: "Release grant funding over time",
        rateLabel: "Release rate",
      },
      subscriptions: {
        recipientLabel: "Subscriber (Sui address)",
        amountLabel: "Subscription amount",
        createBtn: "Create Subscription Stream",
        durationOptions: [
          { value: "30", label: "30s" },
          { value: "60", label: "1m" },
          { value: "3600", label: "1 hour" },
          { value: "86400", label: "1 day" },
          { value: "604800", label: "1 week" },
        ],
        emptyTitle: "No subscription streams",
        emptyHint: "Start a pay-as-you-use subscription",
        rateLabel: "Usage rate",
      },
      vesting: {
        recipientLabel: "Vesting recipient (Sui address)",
        amountLabel: "Token amount",
        createBtn: "Create Vesting Stream",
        durationOptions: [
          { value: "30", label: "30s" },
          { value: "60", label: "1m" },
          { value: "86400", label: "1 day" },
          { value: "604800", label: "1 week" },
          { value: "2592000", label: "30 days" },
        ],
        emptyTitle: "No vesting streams",
        emptyHint: "Stream tokens with linear vesting",
        rateLabel: "Vest rate",
      },
    };
    return configs[currentPage];
  }, [currentPage]);

  const [onchainStreamId, setOnchainStreamId] = useState<string>("");

  // Token selection (simple demo: USDCx, USDT, SUI)
  const tokenOptions = [
    { id: "USDCX", label: "USDCx (stable)", symbol: "USDCx" },
    { id: "USDT", label: "USDT (stable)", symbol: "USDT" },
    { id: "SUI", label: "SUI", symbol: "SUI" },
  ] as const;

  type TokenOption = (typeof tokenOptions)[number];

  const [selectedToken, setSelectedToken] = useState<TokenOption>(tokenOptions[0]);

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100");
  const [duration, setDuration] = useState("60");
  // Page-specific inputs (for functional calculators)
  const [hourlyRate, setHourlyRate] = useState("50");        // Payroll: rate/hr → amount
  const [grantDays, setGrantDays] = useState("7");           // Grants: days → duration
  const [subAmount, setSubAmount] = useState("10");          // Subscriptions: $ per cycle
  const [subCycle, setSubCycle] = useState<"day"|"week"|"month">("month");
  const [vestDays, setVestDays] = useState("30");            // Vesting: days → duration

  // Demo balance
  const [balance, setBalance] = useState(1000);

  // Event log for judges (digest optional for tx links)
  const [eventLog, setEventLog] = useState<{ time: string; event: string; type: string; digest?: string }[]>([]);

  // Stats
  const totalStreamed = streams.reduce((acc, s) => acc + s.withdrawn, 0);
  const totalLocked = streams.reduce((acc, s) => acc + (s.amount - s.withdrawn), 0);

  // Live streaming rate
  const liveRate = useMemo(() => {
    return streams
      .filter(s => Date.now() < s.endTime && Date.now() > s.startTime)
      .reduce((acc, s) => acc + s.amount / ((s.endTime - s.startTime) / 1000), 0);
  }, [streams]);

  const addEvent = (event: string, type: string, digest?: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLog(prev => [{ time, event, type, digest }, ...prev].slice(0, 10));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied!`, "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  // ===========================================
  // Toast
  // ===========================================

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Wallet connect/disconnect handled by dapp-kit; we just read currentAccount

  // ===========================================
  // Stream Progress
  // ===========================================

  const getProgress = (stream: Stream) => {
    const now = Date.now();
    const total = stream.endTime - stream.startTime;
    const elapsed = now - stream.startTime;
    return Math.min(Math.max(elapsed / total, 0), 1) * 100;
  };

  const getClaimable = (stream: Stream) => {
    const progress = getProgress(stream) / 100;
    const vested = stream.amount * progress;
    return Math.max(0, vested - stream.withdrawn);
  };

  // ===========================================
  // Demo Mode Operations (NO WALLET NEEDED)
  // ===========================================

  const createDemoStream = () => {
    console.log("Creating demo stream...");
    
    const id = Math.floor(Math.random() * 100000);
    const amt = parseFloat(amount) * 1_000_000;
    const dur = parseInt(duration);

    if (isNaN(amt) || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    if (amt / 1_000_000 > balance) {
      showToast("Insufficient balance", "error");
      return;
    }

    if (!recipient || recipient.length < 5) {
      showToast("Enter recipient address", "error");
      return;
    }

    const newStream: Stream = {
      streamId: id,
      recipient: recipient,
      amount: amt,
      withdrawn: 0,
      startTime: Date.now(),
      endTime: Date.now() + dur * 1000,
      tokenSymbol: selectedToken.symbol,
    };

    setStreams(prev => [...prev, newStream]);
    setBalance(prev => prev - amt / 1_000_000);
    showToast(`Stream #${id} created!`, "success");
    addEvent(`Created Stream #${id}: ${formatAmount(amt)} ${selectedToken.symbol} over ${dur}s`, "create");
  };

  const claimDemoStream = (id: number) => {
    console.log("Claiming stream:", id);
    
    const stream = streams.find((s) => s.streamId === id);
    if (!stream) {
      showToast("Stream not found", "error");
      return;
    }

    const claimable = getClaimable(stream);
    if (claimable <= 0) {
      showToast("Nothing to claim yet", "error");
      return;
    }

    setStreams(prev =>
      prev.map((s) =>
        s.streamId === id ? { ...s, withdrawn: s.withdrawn + claimable } : s
      )
    );
    const token = stream.tokenSymbol || selectedToken.symbol;
    showToast(`Claimed ${formatAmount(claimable)} ${token}!`, "success");
    addEvent(`Claimed ${formatAmount(claimable)} ${token} from Stream #${id}`, "claim");
  };

  const cancelDemoStream = (id: number) => {
    console.log("Cancelling stream:", id);
    
    const stream = streams.find((s) => s.streamId === id);
    if (!stream) {
      showToast("Stream not found", "error");
      return;
    }

    const progress = getProgress(stream) / 100;
    const vested = stream.amount * progress;
    const refund = stream.amount - vested;

    setStreams(prev => prev.filter((s) => s.streamId !== id));
    setBalance(prev => prev + refund / 1_000_000);
    const token = stream.tokenSymbol || selectedToken.symbol;
    showToast(`Refunded ${formatAmount(refund)} ${token}`, "success");
    addEvent(`Cancelled Stream #${id}, refunded ${formatAmount(refund)} ${token}`, "cancel");
  };

  // ===========================================
  // Quick Demo (one-click)
  // ===========================================

  const runQuickDemo = () => {
    console.log("Running quick demo...");
    
    const id = Math.floor(Math.random() * 100000);
    const amt = 50 * 1_000_000;
    const dur = 30;

    const newStream: Stream = {
      streamId: id,
      recipient: "ST2BOB...DEMO",
      amount: amt,
      withdrawn: 0,
      startTime: Date.now(),
      endTime: Date.now() + dur * 1000,
      tokenSymbol: selectedToken.symbol,
    };

    setStreams(prev => [...prev, newStream]);
    setBalance(prev => prev - 50);
    showToast("Demo stream started! Watch the flow...", "success");
    addEvent(`DEMO: Stream #${id}: 50 ${selectedToken.symbol} over 30s`, "create");
    setShowIntro(false);
  };

  const handleCreateStream = () => {
    console.log("Create stream button clicked");

    // If on-chain config or wallet is missing, fall back to demo mode.
    if (!currentAccount || !SUI_STREAM_PACKAGE_ID) {
      createDemoStream();
      return;
    }

    const amt = parseFloat(amount) * 1_000_000;
    const dur = parseInt(duration || "0", 10);
    if (isNaN(amt) || amt <= 0 || isNaN(dur) || dur <= 0) {
      showToast("Enter a valid amount and duration", "error");
      return;
    }
    if (!isValidSuiAddress(recipient)) {
      showToast("Enter a valid Sui address (0x + 32–64 hex characters)", "error");
      return;
    }

    // For now we only support real on-chain streaming for SUI token.
    if (selectedToken.id !== "SUI") {
      showToast("On-chain streaming is currently enabled for SUI only. Using demo mode for other tokens.", "error");
      createDemoStream();
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();

      const amountMicro = BigInt(Math.floor(amt));
      const nowMs = Date.now();
      const startTimeMs = BigInt(nowMs);
      const endTimeMs = BigInt(nowMs + dur * 1000);

      const [streamCoin] = tx.splitCoins(tx.gas, [amountMicro]);

      tx.moveCall({
        target: `${SUI_STREAM_PACKAGE_ID}::${SUI_STREAM_MODULE}::create_stream`,
        typeArguments: [TOKEN_COIN_TYPES.SUI],
        arguments: [
          tx.pure.address(recipient),
          streamCoin,
          tx.pure.u64(startTimeMs),
          tx.pure.u64(endTimeMs),
        ],
      });

      signAndExecuteTransaction(
        {
          // Cast to any to satisfy dapp-kit typing across nested @mysten/sui versions.
          transaction: tx as any,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: async (result: { digest: string }) => {
            const digest = result.digest;
            showToast(`Stream created! TX: ${digest.slice(0, 10)}...`, "success");
            addEvent(`Sui create_stream: ${digest.slice(0, 16)}...`, "tx", digest);

            // Wait for tx to be indexed, then fetch created Stream object ID
            let streamId = "";
            try {
              const tx = await suiClient.waitForTransaction({
                digest,
                options: { showObjectChanges: true },
                timeout: 15000,
              });
              const created = (tx.objectChanges ?? []).find(
                (c: { type?: string; objectId?: string; objectType?: string }) =>
                  c.type === "created" && c.objectType?.includes("::stream::Stream")
              );
              if (created && "objectId" in created) streamId = created.objectId;
            } catch {
              try {
                const tx = await suiClient.getTransactionBlock({
                  digest,
                  options: { showObjectChanges: true },
                });
                const created = (tx.objectChanges ?? []).find(
                  (c: { type?: string; objectId?: string; objectType?: string }) =>
                    c.type === "created" && c.objectType?.includes("::stream::Stream")
                );
                if (created && "objectId" in created) streamId = created.objectId;
              } catch {
                // Ignore
              }
            }
            if (streamId) {
              setOnchainStreamId(streamId);
              showToast(`Stream ID saved! Wait for vesting, then click Claim.`, "success");
            }
            setLoading(false);
          },
          onError: () => {
            showToast("Sui transaction failed", "error");
            setLoading(false);
          },
        },
      );
    } catch {
      showToast("Failed to build Sui transaction", "error");
      setLoading(false);
    }
  };

  const handleClaimStream = (id: number) => {
    console.log("Claim button clicked, stream:", id);
    // Existing demo streams continue to use in-memory logic.
    claimDemoStream(id);
  };

  const handleCancelStream = (id: number) => {
    console.log("Cancel button clicked, stream:", id);
    // Existing demo streams continue to use in-memory logic.
    cancelDemoStream(id);
  };

  // ===========================================
  // On-chain Claim / Cancel (Sui)
  // ===========================================

  const handleOnchainAction = (kind: "claim" | "cancel") => {
    if (!onchainStreamId || onchainStreamId.length < 5) {
      showToast("Enter a valid on-chain Stream object ID", "error");
      return;
    }
    if (!currentAccount || !SUI_STREAM_PACKAGE_ID) {
      showToast("Connect a Sui wallet and configure VITE_SUI_STREAM_PACKAGE_ID to use on-chain actions", "error");
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();

      tx.moveCall({
        target: `${SUI_STREAM_PACKAGE_ID}::${SUI_STREAM_MODULE}::${kind}`,
        typeArguments: [TOKEN_COIN_TYPES.SUI],
        arguments: [
          tx.object(onchainStreamId),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      signAndExecuteTransaction(
        {
          // Cast to any to satisfy dapp-kit typing across nested @mysten/sui versions.
          transaction: tx as any,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: (result: any) => {
            const digest = result?.digest ?? "";
            const label = kind === "claim" ? "Claim" : "Cancel";
            showToast(
              `${label} TX submitted: ${digest ? digest.slice(0, 10) + "..." : "ok"}`,
              "success",
            );
            addEvent(
              `${label} TX: ${digest ? digest.slice(0, 16) + "..." : "ok"}`,
              "tx",
              digest || undefined,
            );
            setLoading(false);
          },
          onError: () => {
            showToast(`Sui ${kind} transaction failed`, "error");
            setLoading(false);
          },
        },
      );
    } catch {
      showToast("Failed to build Sui transaction", "error");
      setLoading(false);
    }
  };

  // ===========================================
  // Auto-refresh (every 100ms for smooth animation)
  // ===========================================

  useEffect(() => {
    const interval = setInterval(() => {
      setStreams(s => [...s]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ===========================================
  // Intro Screen
  // ===========================================

  if (showIntro) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="bg-gradient-blur bg-gradient-1 fixed" />
        <div className="bg-gradient-blur bg-gradient-2 fixed" />
        
        <div className="relative z-10 text-center max-w-2xl px-6">
          {/* Animated Logo */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 border-2 border-cyan/30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
              <div className="absolute inset-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
              <div className="absolute inset-4 border-2 border-cyan/20 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan/50">
                  <div className="w-10 h-10">{Icons.stream}</div>
                </div>
              </div>
              
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan rounded-full animate-ping" />
              <div className="absolute bottom-4 right-0 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan to-purple-400 bg-clip-text text-transparent tracking-tight">
            Stream Payments
          </h1>
          
          <p className="text-xl text-gray-400 mb-2">
            Real-time payment streams on Sui
          </p>
          
          <p className="text-lg text-cyan mb-8 flex items-center justify-center gap-2">
            <span className="w-5 h-5 inline-block">{Icons.drop}</span>
            Stream money like streaming water
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => {
                console.log("Quick demo clicked");
                runQuickDemo();
              }}
              className="btn-primary text-lg py-4 px-8 glow-cyan flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="w-5 h-5">{Icons.zap}</span>
              Quick Demo
            </button>
            <button
              type="button"
              onClick={() => {
                goToPage("home");
                setShowIntro(false);
              }}
              className="btn-secondary text-lg py-4 px-8 flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter App
              <span className="text-cyan">→</span>
            </button>
          </div>

          <p className="mt-8 text-[12px] text-gray-500 mb-3">Click to open:</p>
          <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
            {[
              { icon: Icons.payroll, label: "Payroll", page: "payroll" as const },
              { icon: Icons.target, label: "Grants", page: "grants" as const },
              { icon: Icons.play, label: "Subscriptions", page: "subscriptions" as const },
              { icon: Icons.handshake, label: "Vesting", page: "vesting" as const },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  goToPage(item.page);
                  setShowIntro(false);
                }}
                className="group text-gray-500 flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 hover:border-cyan/50 hover:bg-cyan/10 hover:text-cyan transition-all cursor-pointer bg-white/5 min-h-[90px]"
              >
                <div className="w-8 h-8 mb-2 text-gray-400 group-hover:text-cyan transition-colors">{item.icon}</div>
                <div className="font-medium">{item.label}</div>
              </button>
            ))}
          </div>

          <p className="mt-12 text-gray-600 text-sm flex items-center justify-center gap-2">
            Built on <span className="text-cyan">Sui</span>
          </p>
        </div>
      </div>
    );
  }

  // ===========================================
  // Main App
  // ===========================================

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-gradient-blur bg-gradient-1 fixed" />
      <div className="bg-gradient-blur bg-gradient-2 fixed" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => { setShowIntro(true); goToPage("home"); }}
              className="w-12 h-12 bg-gradient-to-br from-cyan to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan/30 hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="w-7 h-7">{Icons.stream}</div>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan bg-clip-text text-transparent tracking-tight">
                Stream Payments
              </h1>
              <p className="text-xs text-gray-500">
                {currentPage === "home" ? "Powered by Sui" : `${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Page nav */}
            <nav className="flex gap-1">
              {(["home", "payroll", "grants", "subscriptions", "vesting"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                    currentPage === p
                      ? "bg-cyan/30 text-cyan"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {p === "home" ? "Home" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {currentAccount ? (
              <>
                <div className="flex items-center gap-1.5 bg-surface border border-green-500/30 rounded-full pl-3 pr-1 py-1.5">
                  <span className="status-dot bg-green-500 shrink-0" />
                  <span className="font-mono text-xs text-green-400">{formatAddress(currentAccount.address)}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentAccount.address, "Address")}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-cyan transition-colors cursor-pointer"
                    aria-label="Copy address"
                  >
                    <span className="w-3.5 h-3.5 block">{Icons.copy}</span>
                  </button>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-void/80 border border-white/10 text-gray-400 font-medium">
                  {NETWORK_LABEL}
                </span>
                <ConnectButton className="btn-secondary py-1.5 px-3 rounded-full text-xs cursor-pointer" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-surface border border-orange-500/30 rounded-full px-3 py-1.5">
                  <span className="status-dot bg-orange-500" />
                  <span className="text-xs text-orange-400">Sui Demo Mode</span>
                </div>
                <ConnectButton className="btn-primary py-1.5 px-3 rounded-full text-xs flex items-center gap-1 cursor-pointer">
                  <span className="w-3 h-3">{Icons.wallet}</span>
                  <span>Connect Sui Wallet</span>
                </ConnectButton>
              </>
            )}
          </div>
          </div>
        </header>

        {/* Supported wallets hint */}
        <p className="mt-1 text-[10px] text-gray-500 text-right">
          Works with Sui Wallet, Suiet, Ethos, Surf and other Sui-compatible wallets.
        </p>

        {/* Page header - minimal */}
        <div className="mt-4 mb-3">
          <h2 className="text-lg font-semibold text-cyan">
            {currentPage === "home" && "Stream Payments"}
            {currentPage === "payroll" && "Payroll Streaming"}
            {currentPage === "grants" && "Grant Funding"}
            {currentPage === "subscriptions" && "Subscription Payments"}
            {currentPage === "vesting" && "Token Vesting"}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-cyan font-mono">{formatUSD(balance * 1_000_000)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-3 h-3 opacity-50">{Icons.wallet}</span>
              Balance
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-green-400 font-mono">{formatUSD(totalStreamed)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-3 h-3 opacity-50">{Icons.claim}</span>
              Claimed
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-purple-400 font-mono">{formatUSD(totalLocked)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-3 h-3 opacity-50">{Icons.stream}</span>
              Locked
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="text-2xl font-bold text-yellow-400 font-mono">{formatAmount(liveRate * 1_000_000)}</div>
              {liveRate > 0 && <span className="w-2 h-2 bg-green-500 rounded-full live-indicator" />}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-3 h-3 opacity-50">{Icons.zap}</span>
              USDCx/sec
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Create Stream Form - same working form on every page */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-300">
              <span className="w-6 h-6 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-lg flex items-center justify-center p-1 text-cyan">{Icons.send}</span>
              {pageConfig.createBtn}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{pageConfig.recipientLabel}</label>
                <input
                  type="text"
                  placeholder="0x... (use your address for self-test)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="input py-2 text-sm"
                />
                {currentAccount && !recipient && (
                  <button
                    type="button"
                    onClick={() => setRecipient(currentAccount.address)}
                    className="mt-1 text-[10px] text-cyan hover:underline"
                  >
                    Use my address
                  </button>
                )}
              </div>

              {/* Payroll: rate calculator */}
              {currentPage === "payroll" && (
                <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
                  <label className="block text-[10px] text-cyan mb-1 uppercase">Hourly rate → total</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => {
                        const r = e.target.value;
                        setHourlyRate(r);
                        const dur = parseInt(duration) || 60;
                        const hrs = dur / 3600;
                        setAmount((parseFloat(r) * hrs).toFixed(2));
                      }}
                      className="input py-1.5 text-sm flex-1"
                      placeholder="50"
                    />
                    <span className="text-xs text-gray-500">/hr ×</span>
                    <select
                      aria-label="Payroll duration"
                      value={duration}
                      onChange={(e) => {
                        const d = e.target.value;
                        setDuration(d);
                        const hrs = parseInt(d) / 3600;
                        setAmount((parseFloat(hourlyRate) * hrs).toFixed(2));
                      }}
                      className="input py-1.5 text-sm"
                    >
                      {pageConfig.durationOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Amount: {amount} {selectedToken.symbol}</p>
                </div>
              )}

              {/* Grants: period in days */}
              {currentPage === "grants" && (
                <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
                  <label className="block text-[10px] text-cyan mb-1 uppercase">Release over (days)</label>
                  <input
                    type="number"
                    aria-label="Release period in days"
                    value={grantDays}
                    onChange={(e) => {
                      const d = e.target.value;
                      setGrantDays(d);
                      const days = parseInt(d) || 1;
                      setDuration((days * 86400).toString());
                    }}
                    className="input py-1.5 text-sm"
                    min="1"
                  />
                </div>
              )}

              {/* Subscriptions: plan amount + cycle */}
              {currentPage === "subscriptions" && (
                <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
                  <label className="block text-[10px] text-cyan mb-1 uppercase">Plan</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      aria-label="Subscription amount"
                      value={subAmount}
                      onChange={(e) => {
                        const a = e.target.value;
                        setSubAmount(a);
                        const sec = subCycle === "day" ? 86400 : subCycle === "week" ? 604800 : 2592000;
                        setAmount(a);
                        setDuration(sec.toString());
                      }}
                      className="input py-1.5 text-sm flex-1"
                    />
                    <select
                      aria-label="Subscription cycle"
                      value={subCycle}
                      onChange={(e) => {
                        const c = e.target.value as "day"|"week"|"month";
                        setSubCycle(c);
                        const sec = c === "day" ? 86400 : c === "week" ? 604800 : 2592000;
                        setDuration(sec.toString());
                      }}
                      className="input py-1.5 text-sm"
                    >
                      <option value="day">/ day</option>
                      <option value="week">/ week</option>
                      <option value="month">/ month</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Vesting: vest period in days */}
              {currentPage === "vesting" && (
                <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
                  <label className="block text-[10px] text-cyan mb-1 uppercase">Vest over (days)</label>
                  <input
                    type="number"
                    aria-label="Vest period in days"
                    value={vestDays}
                    onChange={(e) => {
                      const d = e.target.value;
                      setVestDays(d);
                      const days = parseInt(d) || 1;
                      setDuration((days * 86400).toString());
                    }}
                    className="input py-1.5 text-sm"
                    min="1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{pageConfig.amountLabel}</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input py-2 text-sm pr-14"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{selectedToken.symbol}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Token</label>
                  <select
                    aria-label="Select token"
                    value={selectedToken.id}
                    onChange={(e) => {
                      const next = tokenOptions.find(t => t.id === e.target.value as TokenOption["id"]);
                      if (next) setSelectedToken(next);
                    }}
                    className="input py-2 text-sm"
                  >
                    {tokenOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(currentPage === "home" || currentPage === "payroll") && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Duration</label>
                    <select 
                      aria-label="Select duration"
                      value={duration} 
                      onChange={(e) => {
                        const d = e.target.value;
                        setDuration(d);
                        if (currentPage === "payroll") {
                          const hrs = parseInt(d) / 3600;
                          setAmount((parseFloat(hourlyRate) * hrs).toFixed(2));
                        }
                      }} 
                      className="input py-2 text-sm"
                    >
                      {pageConfig.durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {(currentPage === "grants" || currentPage === "subscriptions" || currentPage === "vesting") && (
                <div className="text-[10px] text-gray-500">
                  Duration: {parseInt(duration) < 86400 ? `${parseInt(duration)}s` : `${Math.round(parseInt(duration) / 86400)} days`}
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={handleCreateStream} 
              disabled={loading} 
              className="btn-primary w-full mt-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>{pageConfig.createBtn} <span className="text-black/50">→</span></>
              )}
            </button>

            <div className="mt-3 p-2 bg-deep rounded-lg text-[10px] text-gray-500 flex justify-between">
              <span>{pageConfig.rateLabel}:</span>
              <span className="text-cyan font-mono">
                {(parseFloat(amount || "0") / parseInt(duration || "1")).toFixed(4)} {selectedToken.symbol}/s
              </span>
            </div>

            {/* On-chain Stream Controls */}
            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                <span className="uppercase tracking-wider">On-chain Stream (Sui)</span>
                <span className="text-gray-600">
                  Package:{" "}
                  {SUI_STREAM_PACKAGE_ID
                    ? <span className="font-mono text-cyan">{SUI_STREAM_PACKAGE_ID.slice(0, 8)}...</span>
                    : <span className="text-orange-400">not configured</span>}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  aria-label="On-chain Stream object ID"
                  placeholder="0x<stream_object_id> (auto-filled after Create)"
                  value={onchainStreamId}
                  onChange={(e) => setOnchainStreamId(e.target.value)}
                  className="input py-2 text-[11px] font-mono pr-10"
                />
                {onchainStreamId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(onchainStreamId, "Stream ID")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-cyan transition-colors cursor-pointer"
                    aria-label="Copy Stream ID"
                  >
                    <span className="w-3.5 h-3.5 block">{Icons.copy}</span>
                  </button>
                )}
              </div>
              {onchainStreamId && (
                <a
                  href={getExplorerObjectUrl(onchainStreamId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan hover:underline inline-flex items-center gap-1"
                >
                  View on Suiexplorer <span className="w-3 h-3">{Icons.external}</span>
                </a>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOnchainAction("claim")}
                  disabled={loading}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-[11px] font-semibold py-1.5 px-2 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                >
                  On-chain Claim
                </button>
                <button
                  type="button"
                  onClick={() => handleOnchainAction("cancel")}
                  disabled={loading}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-semibold py-1.5 px-2 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                >
                  On-chain Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Active Streams - same working list on every page */}
          <div className="lg:col-span-2 card p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-300">
              <span className="w-6 h-6 bg-gradient-to-br from-green-500/20 to-cyan/20 rounded-lg flex items-center justify-center p-1 text-green-400">{Icons.chart}</span>
              Active Streams
              {streams.length > 0 && (
                <span className="ml-auto text-[10px] bg-cyan/20 text-cyan px-2 py-0.5 rounded-full font-mono">
                  {streams.length}
                </span>
              )}
            </h2>

            {streams.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-30">{Icons.stream}</div>
                <p className="text-sm">{pageConfig.emptyTitle}</p>
                <p className="text-[10px] text-gray-600 mt-1">{pageConfig.emptyHint}</p>
                <button 
                  type="button"
                  onClick={runQuickDemo} 
                  className="mt-3 text-cyan text-xs hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <span className="w-3 h-3">{Icons.zap}</span>
                  Run Quick Demo
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {streams.map((stream) => (
                  <StreamCard
                    key={stream.streamId}
                    stream={stream}
                    progress={getProgress(stream)}
                    claimable={getClaimable(stream)}
                    onClaim={() => handleClaimStream(stream.streamId)}
                    onCancel={() => handleCancelStream(stream.streamId)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Log */}
        {eventLog.length > 0 && (
          <div className="mt-4 card p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
              <span className="w-6 h-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center p-1 text-yellow-400">{Icons.log}</span>
              Event Log
            </h2>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {eventLog.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 font-mono shrink-0">{e.time}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    e.type === 'create' ? 'bg-cyan' : 
                    e.type === 'claim' ? 'bg-green-500' : 
                    e.type === 'cancel' ? 'bg-red-500' : 
                    e.type === 'tx' ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  {e.digest ? (
                    <a
                      href={getExplorerTxUrl(e.digest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan hover:underline inline-flex items-center gap-1"
                    >
                      {e.event}
                      <span className="w-3 h-3 opacity-70">{Icons.external}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">{e.event}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases - navigate to different pages */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { icon: Icons.payroll, title: "Payroll", desc: "Pay by the second", page: "payroll" as const },
            { icon: Icons.target, title: "Grants", desc: "Milestone funding", page: "grants" as const },
            { icon: Icons.play, title: "Subscriptions", desc: "Pay-as-you-watch", page: "subscriptions" as const },
            { icon: Icons.handshake, title: "Vesting", desc: "Token unlocks", page: "vesting" as const },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => goToPage(item.page)}
              className={`card p-3 text-center hover:border-cyan/30 transition-colors group text-left cursor-pointer border-0 ${
                currentPage === item.page ? "border-cyan/50 ring-1 ring-cyan/30" : ""
              }`}
            >
              <div className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-cyan transition-colors">{item.icon}</div>
              <div className="font-semibold text-xs">{item.title}</div>
              <div className="text-[10px] text-gray-500">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span>Built on <span className="text-cyan font-medium">Sui</span></span>
            <a href="https://suiexplorer.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">
              Sui Explorer
            </a>
            <a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">
              Sui Docs
            </a>
            <span className="text-gray-600">Stream Payments · Real-time payments on Sui</span>
          </div>
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          <span className={toast.type === "success" ? "text-green-400" : "text-red-400"}>
            {toast.type === "success" ? "◉" : "◎"}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Stream Card Component
// ===========================================

function StreamCard({
  stream,
  progress,
  claimable,
  onClaim,
  onCancel,
  loading,
}: {
  stream: Stream;
  progress: number;
  claimable: number;
  onClaim: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const now = Date.now();
  const elapsed = Math.max(0, now - stream.startTime);
  const isComplete = progress >= 100;
  const rate = stream.amount / ((stream.endTime - stream.startTime) / 1000);

  return (
    <div className={`bg-deep border rounded-xl p-3 transition-all ${isComplete ? 'border-cyan/30' : 'border-white/5 hover:border-white/10'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan font-semibold text-sm">#{stream.streamId}</span>
          <span className="text-gray-600">→</span>
          <span className="text-[10px] text-gray-500">{formatAddress(stream.recipient)}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isComplete ? "bg-cyan/20 text-cyan" : "bg-green-500/20 text-green-400"
        }`}>
          {!isComplete && <span className="w-1.5 h-1.5 bg-green-400 rounded-full live-indicator" />}
          {isComplete ? "◉ DONE" : "◉ LIVE"}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-500">
            <span className="text-green-400 font-mono">{formatAmount(stream.withdrawn)}</span>
            <span> / {formatAmount(stream.amount)}</span>
          </span>
          <span className="font-mono text-cyan">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan to-green-400 rounded-full progress-shimmer transition-all duration-100"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-[10px]">
          <div>
            <span className="text-gray-600">Elapsed: </span>
            <span className="font-mono text-cyan">{formatTime(elapsed / 1000)}</span>
          </div>
          <div>
            <span className="text-gray-600">Rate: </span>
            <span className="font-mono text-cyan">{formatAmount(rate * 1_000_000)}/s</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onClaim}
            disabled={claimable <= 0 || loading}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 text-[10px] font-semibold py-1 px-2 rounded-lg transition disabled:opacity-30 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="w-3 h-3">{Icons.claim}</span>
            {formatAmount(claimable)}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] py-1 px-2 rounded-lg transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="w-3 h-3">{Icons.cancel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
