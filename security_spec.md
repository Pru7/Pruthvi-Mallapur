# Security Specification: MMT Trip Assistant

## 1. Data Invariants
- Each user may only access, create, update, or delete trips under their own path `/users/{userId}/trips/{tripId}` where `request.auth.uid == userId`.
- Each user may only access, create, update, or delete drafts under their own path `/users/{userId}/drafts/{draftId}` where `request.auth.uid == userId`.
- Document IDs must conform to alphanumeric characters, dashes, and underscores (max 128 chars).
- Unauthenticated requests are completely rejected.
- Users cannot read or modify any other user's trips or drafts.

## 2. The "Dirty Dozen" Threat Payloads
1. Unauthenticated reading of `/users/{userA}/trips/{trip1}` -> REJECTED
2. Authenticated User B attempting to read User A's trip -> REJECTED
3. Authenticated User B attempting to write to User A's trips -> REJECTED
4. Authenticated User B attempting to delete User A's trip -> REJECTED
5. User A attempting to create a trip document with `userId: "userB"` -> REJECTED
6. User attempting to query collectionGroup or arbitrary root documents -> REJECTED
7. User attempting to inject path traversal or oversized document IDs -> REJECTED
8. Unauthenticated creation of draft sessions -> REJECTED
9. User B updating User A's draft session -> REJECTED
10. Attempting to update a trip changing ownership `userId` -> REJECTED
11. Malicious user attempting to list trips without owning the path -> REJECTED
12. Blanket write to non-existent root collection -> REJECTED
