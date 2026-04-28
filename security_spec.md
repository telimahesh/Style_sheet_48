# Security Specification - LockingStyle Hardware Reserves

## Data Invariants
1. **Public Discovery**: `products`, `categories`, `reviews`, and `pages` must be publicly readable to allow SEO and catalog browsing.
2. **Identity Integrity**: `users` profiles can only be written by the owner. Role fields must be protected.
3. **Relational Ownership**: `orders` must be owned by the user who created them. Only the owner or staff can read/update order details.
4. **Staff Privilege**: Users with roles `admin`, `branch_manager`, or `inventory_clerk`, OR the specific email `telimahesh36@gmail.com` must have elevated access.
5. **PII Protection**: User email and phone numbers must be protected.
6. **Immutability**: `order_id` and `user_id` in orders must not change after creation.

## The Dirty Dozen (Test Payloads)
1. **Shadow Update**: `PATCH /products/node-1 { "price": 0.01, "ghost_field": "hacked" }`
2. **Identity Spoofing**: `POST /orders { "user_id": "other-user", "total": 100 }`
3. **Escalation**: `PATCH /users/my-id { "role": "admin" }`
4. **PII Leak**: `GET /users/some-other-user`
5. **Orphaned Review**: `POST /reviews { "product_id": "missing-id", "comment": "..." }`
6. **Double Spend**: `PATCH /orders/order-1 { "status": "delivered", "total": 0 }`
7. **Junk ID Poisoning**: `POST /products/!@#$%^&*() { "name": "junk" }`
8. **Resource Exhaustion**: `POST /products { "name": "a".repeat(1000000) }`
9. **State Shortcut**: `PATCH /orders/order-1 { "status": "delivered" }` (when it was 'pending') - Only by staff.
10. **Admin Spoof**: `GET /inventory` (unauthenticated)
11. **Review Spam**: `POST /reviews` (multiple reviews for same product by same user)
12. **System Override**: `PATCH /pages/home { "content": "..." }` (by regular user)

## Final Rules Architecture
- **Master Gate**: All writes validated by `isValid[Entity]()`.
- **Relational Sync**: Sub-collections check parent document ownership.
- **Size Guards**: All strings limited to reasonable lengths.
