# Security Specification - NBZ Master Finance AI

## 1. Data Invariants
- **Ownership**: All documents in `transactions`, `reminders`, and `accounts` must have a `userId` field that strictly matches the authenticated user's UID.
- **Enumerations**: 
  - `Transaction.currency`: ["AED", "INR"]
  - `Transaction.type`: ["income", "expense", "lent", "borrowed"]
  - `Account.location`: ["UAE", "India", "Cash"]
- **Immutability**: The `userId` and `createdAt` fields must never change after creation.
- **Timestamps**: `createdAt` and `updatedAt` must be set via `request.time`.

## 2. The Dirty Dozen (Test Payloads)

| # | Attack Vector | Payload Snippet | Expected Result |
|---|---------------|-----------------|-----------------|
| 1 | Identity Spoofing | `{ userId: "other-user", ... }` | PERMISSION_DENIED |
| 2 | PII Snoop | `get(/transactions/someones-doc)` | PERMISSION_DENIED |
| 3 | Ghost Field Injection | `{ isVerified: true, ... }` | PERMISSION_DENIED |
| 4 | Invalid Enum | `{ currency: "USD", ... }` | PERMISSION_DENIED |
| 5 | ID Poisoning | `get(/transactions/VERY_LONG_JUNK_ID...)` | PERMISSION_DENIED |
| 6 | Immutable Break | `update: { userId: "new-user" }` | PERMISSION_DENIED |
| 7 | Timestamp Fraud | `{ createdAt: "1999-01-01..." }` | PERMISSION_DENIED |
| 8 | Boundary Violation | `{ balance: -9999999999 }` | PERMISSION_DENIED |
| 9 | Blanket List Access | `list(/transactions)` | PERMISSION_DENIED |
| 10| Type Logic Leak | `{ amount: "expensive" }` | PERMISSION_DENIED |
| 11| Admin Escalation | `create(/admins/my-uid)` | PERMISSION_DENIED |
| 12| Orphaned Write | `{ transactionId: "non-existent" }` | PERMISSION_DENIED |
