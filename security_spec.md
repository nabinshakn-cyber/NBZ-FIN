# NBZ FIN APP Security Specification

## 1. Data Invariants
- A `transaction` MUST belong to a valid user and have a `userId` matching their auth UID.
- `currency` MUST be either 'AED' or 'INR'.
- `amount` MUST be a positive number.
- `personal_or_business` MUST be 'personal' or 'business'.
- `type` MUST be 'income', 'expense', 'lent', or 'borrowed'.
- `createdAt` and `updatedAt` MUST be server-validated timestamps.

## 2. The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Identity Spoofing**: `create` transaction with `userId` of another person.
2. **Ghost Field Injection**: Add `isAdmin: true` to a transaction.
3. **Negative Amount**: Set `amount: -100`.
4. **Invalid Currency**: Set `currency: "USD"`.
5. **Unauthorized Read**: User B trying to `get` Transaction A belonging to User A.
6. **Unauthorized Update**: User B trying to `update` User A's transaction.
7. **Bypassing Invariant**: `update` changing `userId`.
8. **Shadow Balance Change**: If we had a balance document, trying to update it without a transaction.
9. **Massive ID**: Document ID > 128 characters or containing complex characters.
10. **Timestamp Manipulation**: Providing a future `createdAt` from the client.
11. **Malicious Enum**: Setting `type: "stolen"`.
12. **Public Scrape**: Authenticated user trying to `list` all transactions in the collection without a filter.

## 3. Test Runner (Conceptual)
All the above payloads MUST return `PERMISSION_DENIED` in our rules.
