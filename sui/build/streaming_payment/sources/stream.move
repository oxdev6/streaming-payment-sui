module streaming_payment::stream {
    use sui::coin::{Self as coin, Coin};
    use sui::clock::{Self as clock, Clock};
    use sui::event;
    use sui::object::{Self as object, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;

    /// A time-based streaming payment between a sender and a recipient.
    ///
    /// All funds are stored inside the `coin` field and are linearly vested
    /// between `start_time_ms` and `end_time_ms`.
    ///
    /// Generic over the coin type `T`.
    public struct Stream<phantom T> has key {
        id: UID,
        sender: address,
        recipient: address,
        total_amount: u64,
        withdrawn_amount: u64,
        start_time_ms: u64,
        end_time_ms: u64,
        coin: Coin<T>,
    }

    /// Emitted when a new stream is created.
    public struct StreamCreated<phantom T> has copy, drop {
        sender: address,
        recipient: address,
        total_amount: u64,
        start_time_ms: u64,
        end_time_ms: u64,
    }

    /// Emitted when a recipient successfully claims funds.
    public struct StreamClaimed<phantom T> has copy, drop {
        recipient: address,
        claimed_amount: u64,
        total_withdrawn: u64,
    }

    /// Emitted when a sender cancels a stream.
    public struct StreamCancelled<phantom T> has copy, drop {
        sender: address,
        recipient: address,
        recipient_received: u64,
        sender_refunded: u64,
    }

    /// Create a new streaming payment.
    ///
    /// All coins provided are locked into the created `Stream` object and
    /// will vest linearly between `start_time_ms` and `end_time_ms`.
    public entry fun create_stream<T>(
        recipient: address,
        coin_in: Coin<T>,
        start_time_ms: u64,
        end_time_ms: u64,
        ctx: &mut TxContext,
    ) {
        assert!(end_time_ms > start_time_ms, 1);
        let total_amount = coin::value(&coin_in);
        assert!(total_amount > 0, 2);

        let sender = tx_context::sender(ctx);

        let stream = Stream<T> {
            id: object::new(ctx),
            sender,
            recipient,
            total_amount,
            withdrawn_amount: 0,
            start_time_ms,
            end_time_ms,
            coin: coin_in,
        };

        event::emit(StreamCreated<T> {
            sender,
            recipient,
            total_amount,
            start_time_ms,
            end_time_ms,
        });

        transfer::share_object(stream);
    }

    /// Claim vested but unwithdrawn funds from an existing stream.
    ///
    /// Only the designated `recipient` may successfully claim.
    public entry fun claim<T>(
        stream: &mut Stream<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == stream.recipient, 3);

        let now = clock::timestamp_ms(clock);
        let vested = vested_amount(stream, now);
        let claimable = claimable_amount(stream, vested);
        assert!(claimable > 0, 4);

        // Split out claimable coins and send to recipient.
        let claimed_coin = coin::split(&mut stream.coin, claimable, ctx);
        stream.withdrawn_amount = stream.withdrawn_amount + claimable;

        transfer::public_transfer(claimed_coin, stream.recipient);

        event::emit(StreamClaimed<T> {
            recipient: stream.recipient,
            claimed_amount: claimable,
            total_withdrawn: stream.withdrawn_amount,
        });
    }

    /// Cancel a stream.
    ///
    /// Only the original `sender` may cancel a stream.
    /// Recipient receives any unclaimed vested funds.
    /// Sender receives the remaining unvested refund.
    public entry fun cancel<T>(
        stream: Stream<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == stream.sender, 5);

        let Stream {
            id,
            sender,
            recipient,
            total_amount,
            withdrawn_amount,
            start_time_ms,
            end_time_ms,
            mut coin,
        } = stream;

        let now = clock::timestamp_ms(clock);
        let vested = vested_amount_internal(total_amount, start_time_ms, end_time_ms, now);
        let claimable = claimable_amount_internal(vested, withdrawn_amount);
        let vested_total = withdrawn_amount + claimable;
        let refund = total_amount - vested_total;

        if (claimable > 0) {
            let to_recipient = coin::split(&mut coin, claimable, ctx);
            transfer::public_transfer(to_recipient, recipient);
        };

        if (refund > 0) {
            let to_sender = coin::split(&mut coin, refund, ctx);
            transfer::public_transfer(to_sender, sender);
        };

        // Any dust should be sent back to the sender as well.
        let remaining = coin::value(&coin);
        if (remaining > 0) {
            transfer::public_transfer(coin, sender);
        } else {
            coin::destroy_zero(coin);
        };

        event::emit(StreamCancelled<T> {
            sender,
            recipient,
            recipient_received: claimable,
            sender_refunded: refund,
        });

        object::delete(id);
    }

    /// Compute the vested amount at a given timestamp.
    public fun vested_amount<T>(stream: &Stream<T>, now_ms: u64): u64 {
        vested_amount_internal(stream.total_amount, stream.start_time_ms, stream.end_time_ms, now_ms)
    }

    /// Compute the claimable amount given a vested amount.
    public fun claimable_from_vested<T>(stream: &Stream<T>, vested: u64): u64 {
        claimable_amount(stream, vested)
    }

    /// Internal helper to compute vested amount.
    fun vested_amount_internal(
        total_amount: u64,
        start_time_ms: u64,
        end_time_ms: u64,
        now_ms: u64,
    ): u64 {
        if (now_ms <= start_time_ms) {
            0
        } else if (now_ms >= end_time_ms) {
            total_amount
        } else {
            let duration = end_time_ms - start_time_ms;
            if (duration == 0) {
                total_amount
            } else {
                let elapsed = now_ms - start_time_ms;
                total_amount * elapsed / duration
            }
        }
    }

    /// Internal helper to compute claimable amount from a stream and vested amount.
    fun claimable_amount<T>(stream: &Stream<T>, vested: u64): u64 {
        claimable_amount_internal(vested, stream.withdrawn_amount)
    }

    fun claimable_amount_internal(vested: u64, withdrawn_amount: u64): u64 {
        if (vested <= withdrawn_amount) {
            0
        } else {
            vested - withdrawn_amount
        }
    }

    //
    // ==========================
    // Unit tests (math-focused)
    // ==========================
    //

    #[test]
    fun test_vested_amount_before_start() {
        let total = 1_000;
        let start = 100;
        let end = 200;
        let now = 50;
        let vested = vested_amount_internal(total, start, end, now);
        assert!(vested == 0, 100);
    }

    #[test]
    fun test_vested_amount_after_end() {
        let total = 1_000;
        let start = 100;
        let end = 200;
        let now = 250;
        let vested = vested_amount_internal(total, start, end, now);
        assert!(vested == total, 101);
    }

    #[test]
    fun test_vested_amount_mid_stream() {
        let total = 1_000;
        let start = 100;
        let end = 200;
        let now = 150;
        let vested = vested_amount_internal(total, start, end, now);
        // Halfway through the stream should vest half the amount.
        assert!(vested == 500, 102);
    }

    #[test]
    fun test_claimable_amount_basic() {
        let total = 1_000;
        let start = 100;
        let end = 200;
        let now = 150;
        let vested = vested_amount_internal(total, start, end, now); // 500
        let withdrawn = 200;
        let claimable = claimable_amount_internal(vested, withdrawn);
        assert!(claimable == 300, 103);
    }

    #[test]
    fun test_claimable_amount_zero_when_over_withdrawn() {
        let vested = 400;
        let withdrawn = 500;
        let claimable = claimable_amount_internal(vested, withdrawn);
        assert!(claimable == 0, 104);
    }
}

