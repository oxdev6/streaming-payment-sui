;; ===========================================
;; Mock USDCx Token (SIP-010)
;; ===========================================
;; 
;; A mock fungible token for testing streaming payments.
;; Implements the full SIP-010 standard.
;;
;; In production, replace with the real USDCx contract.
;; ===========================================

(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ==================== TOKEN DEFINITION ====================

(define-fungible-token usdcx)

;; ==================== CONSTANTS ====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))

;; Token metadata (matches real USDCx)
(define-constant TOKEN-NAME "USD Coin X")
(define-constant TOKEN-SYMBOL "USDCx")
(define-constant TOKEN-DECIMALS u6)  ;; 1 USDCx = 1,000,000 micro-units
(define-constant TOKEN-URI (some u"https://www.circle.com/en/usdc"))

;; ==================== SIP-010 IMPLEMENTATION ====================

;; Transfer tokens between accounts
(define-public (transfer 
  (amount uint) 
  (from principal) 
  (to principal) 
  (memo (optional (buff 34))))
  (begin
    ;; Sender must be the 'from' address
    (asserts! (is-eq tx-sender from) ERR-NOT-AUTHORIZED)
    ;; Execute transfer
    (try! (ft-transfer? usdcx amount from to))
    ;; Print memo if provided (for indexers)
    (match memo 
      m (print m) 
      true
    )
    (ok true)
  )
)

;; Get token name
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

;; Get token symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

;; Get decimal places
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

;; Get balance of an account
(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usdcx account))
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx))
)

;; Get token metadata URI
(define-read-only (get-token-uri)
  (ok TOKEN-URI)
)

;; ==================== TESTING UTILITIES ====================

;; Mint tokens to an address (for testing only)
;; In production, this would be restricted or removed
(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (ft-mint? usdcx amount recipient))
    (print { event: "mint", amount: amount, recipient: recipient })
    (ok true)
  )
)

;; Faucet: Get 1000 USDCx for testing
;; Anyone can call this to get test tokens
(define-public (faucet)
  (begin
    (try! (ft-mint? usdcx u1000000000 tx-sender))  ;; 1000 USDCx
    (print { event: "faucet", recipient: tx-sender, amount: u1000000000 })
    (ok u1000000000)
  )
)

;; Burn tokens (optional utility)
(define-public (burn (amount uint))
  (begin
    (try! (ft-burn? usdcx amount tx-sender))
    (print { event: "burn", amount: amount, sender: tx-sender })
    (ok true)
  )
)
