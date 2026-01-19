import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

// ===========================================
// USDCx Streaming Payments - Test Suite
// ===========================================

const CONTRACT = "usdcx-streaming";
const TOKEN = "mock-usdcx";

const tokenPrincipal = (deployer: Account) => `${deployer.address}.${TOKEN}`;

// Helper: get token balance
const getBalance = (chain: Chain, address: string, deployer: Account) => {
  return chain.callReadOnlyFn(TOKEN, "get-balance", [types.principal(address)], deployer.address)
    .result.expectOk().expectUint();
};

// ===========================================
// CREATE STREAM TESTS
// ===========================================

Clarinet.test({
  name: "✅ create-stream: creates stream with user-provided ID",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    // Mint tokens to Alice
    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
    ]);
    block.receipts[0].result.expectOk();

    // Alice creates stream with ID = 42
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(42),                              // stream-id (user-provided)
        types.principal(bob.address),                // recipient
        types.uint(1000),                            // amount
        types.uint(100),                             // duration
        types.principal(tokenPrincipal(deployer)),   // token
      ], alice.address),
    ]);

    block.receipts[0].result.expectOk().expectUint(42);

    // Verify stream exists
    const stream = chain.callReadOnlyFn(CONTRACT, "get-stream", [types.uint(42)], alice.address);
    const data = stream.result.expectSome().expectTuple();
    assertEquals(data["sender"], alice.address);
    assertEquals(data["recipient"], bob.address);
    assertEquals(data["amount"], types.uint(1000));

    console.log("✓ Stream #42 created successfully");
  },
});

Clarinet.test({
  name: "❌ create-stream: fails if stream-id already exists",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
    ]);

    // Create stream with ID = 1
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(100),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);
    block.receipts[0].result.expectOk();

    // Try to create another stream with same ID
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(500), types.uint(50),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(100); // ERR-STREAM-EXISTS
    console.log("✓ Duplicate stream-id correctly rejected");
  },
});

Clarinet.test({
  name: "❌ create-stream: fails with zero duration",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(0),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(101); // ERR-INVALID-DURATION
    console.log("✓ Zero duration correctly rejected");
  },
});

Clarinet.test({
  name: "❌ create-stream: fails with zero amount",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(0), types.uint(100),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(109); // ERR-INVALID-AMOUNT
    console.log("✓ Zero amount correctly rejected");
  },
});

// ===========================================
// CLAIM TESTS
// ===========================================

Clarinet.test({
  name: "✅ claim: recipient claims vested amount",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    // Setup
    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    // Fast forward 5 blocks (50%)
    chain.mineEmptyBlock(5);

    // Bob claims
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [
        types.uint(1), types.principal(tokenPrincipal(deployer)),
      ], bob.address),
    ]);

    const claimed = block.receipts[0].result.expectOk().expectUint();
    assertEquals(claimed >= 400 && claimed <= 600, true);
    console.log(`✓ Bob claimed ${claimed} tokens (~50%)`);
  },
});

Clarinet.test({
  name: "✅ claim: multiple claims accumulate correctly",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    // Setup
    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    let totalClaimed = 0;

    // Claim at 30%
    chain.mineEmptyBlock(3);
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(1), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);
    totalClaimed += block.receipts[0].result.expectOk().expectUint();

    // Claim at 70%
    chain.mineEmptyBlock(4);
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(1), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);
    totalClaimed += block.receipts[0].result.expectOk().expectUint();

    // Claim at 100%+
    chain.mineEmptyBlock(5);
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(1), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);
    totalClaimed += block.receipts[0].result.expectOk().expectUint();

    assertEquals(totalClaimed, 1000);
    console.log(`✓ Multiple claims totaled ${totalClaimed}`);
  },
});

Clarinet.test({
  name: "❌ claim: non-recipient cannot claim",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    const charlie = accounts.get("wallet_3")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    chain.mineEmptyBlock(5);

    // Charlie tries to claim
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(1), types.principal(tokenPrincipal(deployer))], charlie.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(103); // ERR-NOT-RECIPIENT
    console.log("✓ Non-recipient correctly rejected");
  },
});

Clarinet.test({
  name: "❌ claim: fails when nothing to claim",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    // Immediately try to claim
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(1), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(104); // ERR-NOTHING-TO-CLAIM
    console.log("✓ Empty claim correctly rejected");
  },
});

// ===========================================
// CANCEL STREAM TESTS
// ===========================================

Clarinet.test({
  name: "✅ cancel-stream: refunds sender, pays recipient vested",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    const aliceAfterCreate = getBalance(chain, alice.address, deployer);
    assertEquals(aliceAfterCreate, 9000);

    // Fast forward 4 blocks (~40%)
    chain.mineEmptyBlock(4);

    // Cancel
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "cancel-stream", [
        types.uint(1), types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    const result = block.receipts[0].result.expectOk().expectTuple();
    const refund = result["refunded"].expectUint();
    const recipientReceived = result["recipient-received"].expectUint();

    assertEquals(refund + recipientReceived, 1000);

    // Verify stream is deleted
    const stream = chain.callReadOnlyFn(CONTRACT, "get-stream", [types.uint(1)], alice.address);
    stream.result.expectNone();

    console.log(`✓ Cancel: sender refunded ${refund}, recipient got ${recipientReceived}`);
  },
});

Clarinet.test({
  name: "❌ cancel-stream: non-sender cannot cancel",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(10),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    // Bob tries to cancel
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "cancel-stream", [
        types.uint(1), types.principal(tokenPrincipal(deployer)),
      ], bob.address),
    ]);

    block.receipts[0].result.expectErr().expectUint(107); // ERR-NOT-SENDER
    console.log("✓ Non-sender cancel correctly rejected");
  },
});

// ===========================================
// READ-ONLY TESTS
// ===========================================

Clarinet.test({
  name: "📊 read-only: get-progress returns correct percentage",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(1), types.principal(bob.address), types.uint(1000), types.uint(100),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);

    // At start
    let progress = chain.callReadOnlyFn(CONTRACT, "get-progress", [types.uint(1)], alice.address);
    progress.result.expectOk().expectUint(0);

    // At 50%
    chain.mineEmptyBlock(50);
    progress = chain.callReadOnlyFn(CONTRACT, "get-progress", [types.uint(1)], alice.address);
    const pct = progress.result.expectOk().expectUint();
    assertEquals(pct >= 48 && pct <= 52, true);

    // At 100%+
    chain.mineEmptyBlock(60);
    progress = chain.callReadOnlyFn(CONTRACT, "get-progress", [types.uint(1)], alice.address);
    progress.result.expectOk().expectUint(100);

    console.log("✓ Progress calculation correct");
  },
});

// ===========================================
// FULL LIFECYCLE TEST
// ===========================================

Clarinet.test({
  name: "🔄 FULL LIFECYCLE: create → claim → claim → verify",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    console.log("\n=== FULL LIFECYCLE ===\n");

    // 1. Mint
    let block = chain.mineBlock([
      Tx.contractCall(TOKEN, "mint", [types.uint(10000), types.principal(alice.address)], deployer.address),
    ]);
    console.log("1️⃣ Minted 10,000 USDCx to Alice");

    // 2. Create stream (ID = 999)
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "create-stream", [
        types.uint(999), types.principal(bob.address), types.uint(1000), types.uint(20),
        types.principal(tokenPrincipal(deployer)),
      ], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(999);
    console.log("2️⃣ Created Stream #999: 1000 USDCx to Bob over 20 blocks");

    // 3. Claim at 50%
    chain.mineEmptyBlock(10);
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(999), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);
    const claim1 = block.receipts[0].result.expectOk().expectUint();
    console.log(`3️⃣ Bob claimed ${claim1} at 50%`);

    // 4. Claim at 100%
    chain.mineEmptyBlock(15);
    block = chain.mineBlock([
      Tx.contractCall(CONTRACT, "claim", [types.uint(999), types.principal(tokenPrincipal(deployer))], bob.address),
    ]);
    const claim2 = block.receipts[0].result.expectOk().expectUint();
    console.log(`4️⃣ Bob claimed ${claim2} at 100%`);

    // 5. Verify final balances
    const aliceFinal = getBalance(chain, alice.address, deployer);
    const bobFinal = getBalance(chain, bob.address, deployer);

    console.log(`\n=== FINAL ===`);
    console.log(`Alice: ${aliceFinal}`);
    console.log(`Bob: ${bobFinal}`);
    console.log(`Total: ${aliceFinal + bobFinal}`);

    assertEquals(aliceFinal + bobFinal, 10000);
    assertEquals(bobFinal, 1000);

    console.log("\n✅ Full lifecycle complete!");
  },
});
