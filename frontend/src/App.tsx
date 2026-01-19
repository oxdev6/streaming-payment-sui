import React, { useEffect, useState, useMemo } from "react";
import { AppConfig, showConnect, UserSession, openContractCall } from "@stacks/connect";
import {
  uintCV,
  principalCV,
  PostConditionMode,
  AnchorMode,
} from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

// ===========================================
// Configuration
// ===========================================

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });
const network = new StacksTestnet();

// ============================================
// 👇 CHANGE THIS TO YOUR DEPLOYED ADDRESS 👇
// ============================================
const CONTRACT_ADDRESS = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
// ============================================

const CONTRACT_NAME = "usdcx-streaming";
const TOKEN_CONTRACT = "mock-usdcx";

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
}

interface UserData {
  profile: {
    stxAddress: { testnet: string; mainnet: string };
  };
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

// ===========================================
// App Component
// ===========================================

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Form state
  const [recipient, setRecipient] = useState("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG");
  const [amount, setAmount] = useState("100");
  const [duration, setDuration] = useState("60");

  // Demo balance
  const [balance, setBalance] = useState(1000);

  // Event log for judges
  const [eventLog, setEventLog] = useState<{ time: string; event: string; type: string }[]>([]);

  // Stats
  const totalStreamed = streams.reduce((acc, s) => acc + s.withdrawn, 0);
  const totalLocked = streams.reduce((acc, s) => acc + (s.amount - s.withdrawn), 0);

  // Live streaming rate
  const liveRate = useMemo(() => {
    return streams
      .filter(s => Date.now() < s.endTime && Date.now() > s.startTime)
      .reduce((acc, s) => acc + s.amount / ((s.endTime - s.startTime) / 1000), 0);
  }, [streams]);

  const addEvent = (event: string, type: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLog(prev => [{ time, event, type }, ...prev].slice(0, 10));
  };

  // ===========================================
  // Toast
  // ===========================================

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ===========================================
  // Auth
  // ===========================================

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((data) => {
        setUser(data as UserData);
      });
    } else if (userSession.isUserSignedIn()) {
      setUser(userSession.loadUserData() as UserData);
    }
  }, []);

  const connectWallet = () => {
    console.log("Connect wallet clicked");
    showConnect({
      appDetails: { 
        name: "USDCx Streaming", 
        icon: window.location.origin + "/icon.png" 
      },
      redirectTo: "/",
      onFinish: () => {
        const userData = userSession.loadUserData();
        setUser(userData as UserData);
        showToast("Wallet connected!", "success");
        addEvent("Wallet connected", "success");
      },
      onCancel: () => {
        showToast("Connection cancelled", "error");
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut("/");
    setUser(null);
    showToast("Disconnected", "success");
    addEvent("Wallet disconnected", "info");
  };

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
    };

    setStreams(prev => [...prev, newStream]);
    setBalance(prev => prev - amt / 1_000_000);
    showToast(`Stream #${id} created!`, "success");
    addEvent(`Created Stream #${id}: ${formatAmount(amt)} USDCx over ${dur}s`, "create");
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
    showToast(`Claimed ${formatAmount(claimable)} USDCx!`, "success");
    addEvent(`Claimed ${formatAmount(claimable)} from Stream #${id}`, "claim");
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
    showToast(`Refunded ${formatAmount(refund)} USDCx`, "success");
    addEvent(`Cancelled Stream #${id}, refunded ${formatAmount(refund)}`, "cancel");
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
    };

    setStreams(prev => [...prev, newStream]);
    setBalance(prev => prev - 50);
    showToast("Demo stream started! Watch the flow...", "success");
    addEvent(`DEMO: Stream #${id}: 50 USDCx over 30s`, "create");
    setShowIntro(false);
  };

  // ===========================================
  // Contract Operations (WITH WALLET)
  // ===========================================

  const handleCreateStream = () => {
    console.log("Create stream button clicked, user:", user);
    
    if (!user) {
      // Demo mode - no wallet connected
      createDemoStream();
      return;
    }

    // Real blockchain transaction
    setLoading(true);
    const id = Math.floor(Math.random() * 100000);
    
    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "create-stream",
      functionArgs: [
        uintCV(id),
        principalCV(recipient),
        uintCV(parseFloat(amount) * 1_000_000),
        uintCV(parseInt(duration)),
        principalCV(`${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}`),
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        showToast(`TX submitted: ${data.txId.slice(0, 10)}...`, "success");
        addEvent(`TX: ${data.txId.slice(0, 16)}...`, "tx");
        setLoading(false);
      },
      onCancel: () => {
        showToast("Transaction cancelled", "error");
        setLoading(false);
      },
    });
  };

  const handleClaimStream = (id: number) => {
    console.log("Claim button clicked, stream:", id);
    
    if (!user) {
      claimDemoStream(id);
      return;
    }

    setLoading(true);
    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "claim",
      functionArgs: [
        uintCV(id), 
        principalCV(`${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}`)
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        showToast(`Claimed! TX: ${data.txId.slice(0, 10)}...`, "success");
        addEvent(`Claim TX: ${data.txId.slice(0, 16)}...`, "tx");
        setLoading(false);
      },
      onCancel: () => {
        showToast("Cancelled", "error");
        setLoading(false);
      },
    });
  };

  const handleCancelStream = (id: number) => {
    console.log("Cancel button clicked, stream:", id);
    
    if (!user) {
      cancelDemoStream(id);
      return;
    }

    setLoading(true);
    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "cancel-stream",
      functionArgs: [
        uintCV(id), 
        principalCV(`${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}`)
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        showToast(`Cancelled! TX: ${data.txId.slice(0, 10)}...`, "success");
        addEvent(`Cancel TX: ${data.txId.slice(0, 16)}...`, "tx");
        setLoading(false);
      },
      onCancel: () => {
        showToast("Cancelled", "error");
        setLoading(false);
      },
    });
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
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan to-purple-400 bg-clip-text text-transparent">
            USDCx Streaming
          </h1>
          
          <p className="text-xl text-gray-400 mb-2">
            Real-time payment streams on Stacks
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
                console.log("Enter app clicked");
                setShowIntro(false);
              }}
              className="btn-secondary text-lg py-4 px-8 flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter App
              <span className="text-cyan">→</span>
            </button>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-4 text-sm">
            {[
              { icon: Icons.payroll, label: "Payroll" },
              { icon: Icons.target, label: "Grants" },
              { icon: Icons.play, label: "Subscriptions" },
              { icon: Icons.handshake, label: "Vesting" },
            ].map((item) => (
              <div key={item.label} className="text-gray-500 flex flex-col items-center">
                <div className="w-8 h-8 mb-2 text-gray-400">{item.icon}</div>
                <div>{item.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-gray-600 text-sm flex items-center justify-center gap-2">
Built on <span className="text-cyan">Stacks</span>
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
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowIntro(true)}
              className="w-12 h-12 bg-gradient-to-br from-cyan to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan/30 hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="w-7 h-7">{Icons.stream}</div>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan bg-clip-text text-transparent">
                USDCx Streaming
              </h1>
              <p className="text-xs text-gray-500">Powered by Stacks</p>
            </div>
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-surface border border-green-500/30 rounded-full px-3 py-1.5">
                  <span className="status-dot bg-green-500" />
                  <span className="font-mono text-xs text-green-400">{formatAddress(user.profile.stxAddress.testnet)}</span>
                </div>
                <button 
                  type="button"
                  onClick={disconnectWallet} 
                  className="btn-secondary py-1.5 px-3 rounded-full text-xs cursor-pointer"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-surface border border-orange-500/30 rounded-full px-3 py-1.5">
                  <span className="status-dot bg-orange-500" />
                  <span className="text-xs text-orange-400">Demo Mode</span>
                </div>
                <button 
                  type="button"
                  onClick={connectWallet} 
                  className="btn-primary py-1.5 px-3 rounded-full text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-3 h-3">{Icons.wallet}</span>
                  Connect
                </button>
              </>
            )}
          </div>
        </header>

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
          {/* Create Stream Form */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-300">
              <span className="w-6 h-6 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-lg flex items-center justify-center p-1 text-cyan">{Icons.send}</span>
              Create Stream
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Recipient</label>
                <input
                  type="text"
                  placeholder="ST2CY5V39..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="input py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input py-2 text-sm pr-14"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">USDCx</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Duration</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    className="input py-2 text-sm"
                  >
                    <option value="30">30s</option>
                    <option value="60">1m</option>
                    <option value="120">2m</option>
                  </select>
                </div>
              </div>
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
                <>Create Stream <span className="text-black/50">→</span></>
              )}
            </button>

            <div className="mt-3 p-2 bg-deep rounded-lg text-[10px] text-gray-500 flex justify-between">
              <span>Rate:</span>
              <span className="text-cyan font-mono">
                {(parseFloat(amount || "0") / parseInt(duration || "1")).toFixed(4)} USDCx/s
              </span>
            </div>
          </div>

          {/* Active Streams */}
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
                <p className="text-sm">No streams yet</p>
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
                  <span className="text-gray-600 font-mono">{e.time}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    e.type === 'create' ? 'bg-cyan' : 
                    e.type === 'claim' ? 'bg-green-500' : 
                    e.type === 'cancel' ? 'bg-red-500' : 
                    e.type === 'tx' ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-400">{e.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { icon: Icons.payroll, title: "Payroll", desc: "Pay by the second" },
            { icon: Icons.target, title: "Grants", desc: "Milestone funding" },
            { icon: Icons.play, title: "Subscriptions", desc: "Pay-as-you-watch" },
            { icon: Icons.handshake, title: "Vesting", desc: "Token unlocks" },
          ].map((item) => (
            <div key={item.title} className="card p-3 text-center hover:border-cyan/30 transition-colors group">
              <div className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-cyan transition-colors">{item.icon}</div>
              <div className="font-semibold text-xs">{item.title}</div>
              <div className="text-[10px] text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center mt-6 text-gray-600 text-xs flex items-center justify-center gap-2">
          Built on <span className="text-cyan">Stacks</span>
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
