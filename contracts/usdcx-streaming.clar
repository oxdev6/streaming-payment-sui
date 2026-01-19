;; ===========================================
;; USDCx Streaming Payments - Production Version
;; ===========================================
;;
;; Features:
;; - User-provided stream IDs
;; - Event emissions via print
;; - Safe math & overflow protection
;; - Multi-stream support per sender/recipient
;;
;; Built for Stacks Hackathon
;; ===========================================

;; ==================== TRAITS ====================

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ==================== CONSTANTS ====================

(define-constant ERR-STREAM-EXISTS (err u100))
(define-constant ERR-INVALID-DURATION (err u101))
(define-constant ERR-TRANSFER-FAILED (err u102))
(define-constant ERR-NOT-RECIPIENT (err u103))
(define-constant ERR-NOTHING-TO-CLAIM (err u104))
(define-constant ERR-CLAIM-FAILED (err u105))
(define-constant ERR-STREAM-NOT-FOUND (err u106))
(define-constant ERR-NOT-SENDER (err u107))
(define-constant ERR-REFUND-FAILED (err u108))
(define-constant ERR-INVALID-AMOUNT (err u109))
(define-constant ERR-SELF-STREAM (err u110))

;; ==================== DATA STORAGE ====================

;; Stream data map - keyed by user-provided stream-id
(define-map streams
  uint
  {
    sender: principal,
    recipient: principal,
    token: principal,
    amount: uint,
    start-time: uint,
    end-time: uint,
    withdrawn: uint
  }
)

;; Track total streams created (for analytics)
(define-data-var total-streams uint u0)

;; ==================== PRIVATE HELPERS ====================

;; Safe subtraction (returns 0 if would underflow)
(define-private (safe-sub (a uint) (b uint))
  (if (>= a b) (- a b) u0)
)

;; Calculate claimable amount at current block
(define-private (calc-claimable (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let
      (
        (amount (get amount stream))
        (start (get start-time stream))
        (end (get end-time stream))
        (withdrawn (get withdrawn stream))
        (now block-height)
        (total-duration (safe-sub end start))
      )
      (if (is-eq total-duration u0)
        u0
        (let
          (
            (elapsed (if (<= now start) u0 (if (>= now end) total-duration (safe-sub now start))))
            (vested (/ (* amount elapsed) total-duration))
          )
          (safe-sub vested withdrawn)
        )
      )
    )
    u0
  )
)

;; ==================== READ-ONLY FUNCTIONS ====================

;; Get stream details
(define-read-only (get-stream (stream-id uint))
  (map-get? streams stream-id)
)

;; Check if stream exists
(define-read-only (stream-exists (stream-id uint))
  (is-some (map-get? streams stream-id))
)

;; Get claimable amount for a stream
(define-read-only (get-claimable (stream-id uint))
  (ok (calc-claimable stream-id))
)

;; Get vested amount (total unlocked so far)
(define-read-only (get-vested (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let
      (
        (amount (get amount stream))
        (start (get start-time stream))
        (end (get end-time stream))
        (now block-height)
        (total-duration (safe-sub end start))
      )
      (if (is-eq total-duration u0)
        (ok amount)
        (let
          (
            (elapsed (if (<= now start) u0 (if (>= now end) total-duration (safe-sub now start))))
          )
          (ok (/ (* amount elapsed) total-duration))
        )
      )
    )
    (err u106)
  )
)

;; Get stream progress (0-100)
(define-read-only (get-progress (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let
      (
        (start (get start-time stream))
        (end (get end-time stream))
        (now block-height)
        (total-duration (safe-sub end start))
      )
      (if (is-eq total-duration u0)
        (ok u100)
        (let
          (
            (elapsed (if (<= now start) u0 (if (>= now end) total-duration (safe-sub now start))))
          )
          (ok (/ (* elapsed u100) total-duration))
        )
      )
    )
    (err u106)
  )
)

;; Get current block height
(define-read-only (get-block)
  block-height
)

;; Get total streams created
(define-read-only (get-total-streams)
  (var-get total-streams)
)

;; ==================== PUBLIC FUNCTIONS ====================

;; ===========================================
;; Create a new stream
;; ===========================================
;; @param stream-id - Unique identifier (user-provided)
;; @param recipient - Who receives the funds
;; @param amount - Total amount to stream
;; @param duration - Number of blocks
;; @param token - SIP-010 token contract
;;
(define-public (create-stream
  (stream-id uint)
  (recipient principal)
  (amount uint)
  (duration uint)
  (token <ft-trait>))
  (let
    (
      (sender tx-sender)
      (now block-height)
      (end-time (+ now duration))
    )
    ;; Validations
    (asserts! (is-none (map-get? streams stream-id)) ERR-STREAM-EXISTS)
    (asserts! (> duration u0) ERR-INVALID-DURATION)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (is-eq sender recipient)) ERR-SELF-STREAM)

    ;; Transfer tokens from sender to contract
    (match (contract-call? token transfer amount sender (as-contract tx-sender) none)
      success
      (begin
        ;; Store stream data
        (map-insert streams stream-id
          {
            sender: sender,
            recipient: recipient,
            token: (contract-of token),
            amount: amount,
            start-time: now,
            end-time: end-time,
            withdrawn: u0
          }
        )

        ;; Update counter
        (var-set total-streams (+ (var-get total-streams) u1))

        ;; === EVENT: stream-created ===
        (print {
          event: "stream-created",
          stream-id: stream-id,
          sender: sender,
          recipient: recipient,
          amount: amount,
          start-time: now,
          end-time: end-time
        })

        (ok stream-id)
      )
      error ERR-TRANSFER-FAILED
    )
  )
)

;; ===========================================
;; Claim funds from a stream
;; ===========================================
;; @param stream-id - Stream to claim from
;; @param token - SIP-010 token contract
;;
(define-public (claim (stream-id uint) (token <ft-trait>))
  (match (map-get? streams stream-id)
    stream
    (let
      (
        (recipient (get recipient stream))
        (token-principal (get token stream))
        (amount (get amount stream))
        (start (get start-time stream))
        (end (get end-time stream))
        (withdrawn (get withdrawn stream))
        (claimable (calc-claimable stream-id))
      )
      ;; Only recipient can claim
      (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)

      ;; Verify token matches
      (asserts! (is-eq (contract-of token) token-principal) ERR-TRANSFER-FAILED)

      ;; Must have something to claim
      (asserts! (> claimable u0) ERR-NOTHING-TO-CLAIM)

      ;; Transfer tokens to recipient
      (match (as-contract (contract-call? token transfer claimable tx-sender recipient none))
        success
        (begin
          ;; Update withdrawn amount
          (map-set streams stream-id
            (merge stream { withdrawn: (+ withdrawn claimable) })
          )

          ;; === EVENT: stream-claimed ===
          (print {
            event: "stream-claimed",
            stream-id: stream-id,
            recipient: recipient,
            claimed: claimable,
            total-withdrawn: (+ withdrawn claimable)
          })

          (ok claimable)
        )
        error ERR-CLAIM-FAILED
      )
    )
    ERR-STREAM-NOT-FOUND
  )
)

;; ===========================================
;; Cancel stream (sender only)
;; ===========================================
;; Refunds unvested amount to sender.
;; Recipient keeps any vested (but unclaimed) funds in contract.
;;
;; @param stream-id - Stream to cancel
;; @param token - SIP-010 token contract
;;
(define-public (cancel-stream (stream-id uint) (token <ft-trait>))
  (match (map-get? streams stream-id)
    stream
    (let
      (
        (sender (get sender stream))
        (recipient (get recipient stream))
        (token-principal (get token stream))
        (amount (get amount stream))
        (withdrawn (get withdrawn stream))
        (claimable (calc-claimable stream-id))
        (vested (+ withdrawn claimable))
        (refund (safe-sub amount vested))
      )
      ;; Only sender can cancel
      (asserts! (is-eq tx-sender sender) ERR-NOT-SENDER)

      ;; Verify token matches
      (asserts! (is-eq (contract-of token) token-principal) ERR-TRANSFER-FAILED)

      ;; Pay recipient any unclaimed vested amount
      (if (> claimable u0)
        (match (as-contract (contract-call? token transfer claimable tx-sender recipient none))
          success true
          error (asserts! false ERR-CLAIM-FAILED)
        )
        true
      )

      ;; Refund sender the unvested amount
      (if (> refund u0)
        (match (as-contract (contract-call? token transfer refund tx-sender sender none))
          success true
          error (asserts! false ERR-REFUND-FAILED)
        )
        true
      )

      ;; Delete the stream
      (map-delete streams stream-id)

      ;; === EVENT: stream-cancelled ===
      (print {
        event: "stream-cancelled",
        stream-id: stream-id,
        sender: sender,
        recipient-received: claimable,
        sender-refunded: refund
      })

      (ok { refunded: refund, recipient-received: claimable })
    )
    ERR-STREAM-NOT-FOUND
  )
)
