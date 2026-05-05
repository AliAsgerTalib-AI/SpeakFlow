# Security Specification - SpeakFlow

## Data Invariants
1. A session must be owned by a valid user.
2. Sessions are read-only after creation (append-only logs).
3. Access is restricted to the owner of the session.

## The Dirty Dozen (Test cases)
1. Write session with different `userId`: DENIED
2. Read session not owned by user: DENIED
3. Delete session: DENIED
4. Update feedback field: DENIED
5. Missing `script` field on create: DENIED
6. Spoof `timestamp` (use client time): DENIED
7. Inject huge string as `sessionId`: DENIED (handled by ID rules)
8. Unauthenticated read: DENIED
9. Unauthenticated write: DENIED
10. List sessions without `userId` filter: DENIED (rules enforce check)
11. Write with invalid feedback type (string instead of map): DENIED
12. Creating session for another user ID: DENIED
