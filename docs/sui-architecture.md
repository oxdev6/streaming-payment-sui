## Sui Streaming Payments Architecture

### Goals

- Sui-native streaming payments protocol, conceptually mirroring the existing Stacks `usdcx-streaming` contract.
- Minimal but solid MVP for Sui testnet: create stream, claim/withdraw, cancel, read progress.
- Initially support a single fungible coin type (e.g. a USDCx-like Sui coin), but design for future multi-coin support.

### Core Concepts

- **Stream**: A time-based vesting agreement between a sender and a recipient, funded upfront.
- **Vesting**: Linear vesting from `start_time_ms` to `end_time_ms`.
- **Withdrawals**: Recipient can periodically withdraw vested but unwithdrawn funds.
- **Cancellation**: Sender may cancel an active stream. Recipient receives any vested-but-unwithdrawn portion, sender is refunded the remainder.

### On-chain Data Model (Move)

Module: `streaming::stream`

- **Structs**

  - `struct Stream has key`  
    - `id: UID` — Sui object ID for the stream.
    - `sender: address` — Stream creator, funds provider.
    - `recipient: address` — Payment receiver.
    - `coin_type: phantom<T>` — Type parameter for the streamed coin.
    - `total_amount: u64` — Total amount funded into the stream (in smallest units).
    - `withdrawn_amount: u64` — Amount already withdrawn by the recipient.
    - `start_time_ms: u64` — UTC timestamp (ms) when vesting begins.
    - `end_time_ms: u64` — UTC timestamp (ms) when vesting ends.

  - `struct StreamAdmin has key, store` (optional for analytics)
    - May hold a `Table<ID, StreamSummary>` or counters such as `total_streams`.

- **Events**

  - `struct StreamCreated<T>`  
    - `stream_id: ID`
    - `sender: address`
    - `recipient: address`
    - `total_amount: u64`
    - `start_time_ms: u64`
    - `end_time_ms: u64`

  - `struct StreamClaimed<T>`  
    - `stream_id: ID`
    - `recipient: address`
    - `claimed_amount: u64`
    - `total_withdrawn: u64`

  - `struct StreamCancelled<T>`  
    - `stream_id: ID`
    - `sender: address`
    - `recipient_received: u64`
    - `sender_refunded: u64`

### Vesting Logic

Given:
- `now` = current timestamp in ms (from Sui `Clock`).
- `duration = end_time_ms - start_time_ms`.

Vested amount \(V\) at time `now`:
- If `now <= start_time_ms`: \(V = 0\)
- If `now >= end_time_ms`: \(V = total_amount\)
- Else:  
  \[
    V = total_amount * (now - start_time_ms) / duration
  \]

Claimable amount:
- `claimable = V - withdrawn_amount`, clamped to `>= 0`.

### Public Entry Functions (Move)

Generic over coin type `T: coin::Coin`.

- `public entry fun create_stream<T>(
    sender: &mut TxContext,
    recipient: address,
    mut coin: Coin<T>,
    start_time_ms: u64,
    end_time_ms: u64
  )`

  - **Behavior**:
    - Require `end_time_ms > start_time_ms`.
    - Compute `total_amount = coin::value(&coin)`.
    - Require `total_amount > 0`.
    - Create a new `Stream<T>` object holding all `coin`.
    - Emit `StreamCreated<T>` event.

- `public entry fun claim<T>(
    stream: &mut Stream<T>,
    clock: &Clock,
    recipient: &mut TxContext
  )`

  - **Behavior**:
    - Require that `recipient::sender_address() == stream.recipient`.
    - Compute vested \(V\) and `claimable`.
    - Require `claimable > 0`.
    - Split `claimable` amount out of the stream’s internal `Coin<T>`.
    - Transfer `claimable` coins to `stream.recipient`.
    - Update `withdrawn_amount`.
    - Emit `StreamClaimed<T>` event.

- `public entry fun cancel<T>(
    stream: &mut Stream<T>,
    clock: &Clock,
    sender_ctx: &mut TxContext
  )`

  - **Behavior**:
    - Require that `sender_address(sender_ctx) == stream.sender`.
    - Compute vested \(V\), claimable, and refund:
      - `vested = withdrawn_amount + claimable`
      - `refund = total_amount - vested`
    - If `claimable > 0`, split and send `claimable` coins to `recipient`.
    - If `refund > 0`, split and send remaining to `sender`.
    - Delete the `Stream<T>` object.
    - Emit `StreamCancelled<T>` event with `recipient_received` and `sender_refunded`.

- **Read-only / helper functions**

These can be implemented as:

- `public fun get_claimable<T>(stream: &Stream<T>, clock: &Clock): u64`
- `public fun get_progress<T>(stream: &Stream<T>, clock: &Clock): u64`  
  Returns a percentage `0..=100`.

### Off-chain Integration

- Frontend calls:
  - `create_stream` to open a stream.
  - `claim` to withdraw vested funds.
  - `cancel` to close stream and settle balances.
- Frontend / indexer reads:
  - Stream fields via Sui RPC (object read).
  - Events for history (`StreamCreated`, `StreamClaimed`, `StreamCancelled`).

### Initial Token Support

- MVP: support a single stable-like coin `T` (e.g. `USDCxCoin`) by:
  - Publishing a Move coin module (or using an existing testnet coin).
  - Documenting its type argument for the frontend environment (e.g. `COIN_TYPE=<package_id>::usdcx::USDCX`).

Future extensions:
- Support multi-token streams by relying on type arguments and/or configuration objects.
- Add protocol fees (percentage taken at claim or at create time).

### Move Error Codes (stream.move)

| Code | Function | Meaning |
|------|----------|---------|
| 1 | create_stream | Invalid duration: `end_time_ms` must be greater than `start_time_ms` |
| 2 | create_stream | Invalid amount: `total_amount` must be greater than zero |
| 3 | claim | Caller is not the stream recipient |
| 4 | claim | Nothing to claim yet (claimable amount is zero) |
| 5 | cancel | Caller is not the stream sender |

