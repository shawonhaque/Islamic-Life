# Security Specification — Islamic Life Firestore Rules

## 1. Data Invariants
1. Every document under `/users/{userId}` and its subcollections (`private`, `prayerLogs`, `studyNotes`, `chatThreads`, `messages`, `audioTranscripts`) MUST belong to the verified authenticated user (`request.auth != null && request.auth.token.email_verified == true && request.auth.uid == userId && incoming().uid == request.auth.uid`).
2. PII (`email`) is strictly isolated in `/users/{userId}/private/info` and never placed on `/users/{userId}` or readable by other signed-in users.
3. All document IDs (`userId`, `noteId`, `threadId`, `messageId`, `transcriptId`) MUST match `^[a-zA-Z0-9_\-]+$` and be `<= 128` chars (`dateKey` matches `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`).
4. Subcollection `messages` MUST verify parent `chatThreads/{threadId}` exists and `uid == request.auth.uid` via `get()` (Master Gate).
5. `createdAt` and `uid` are immutable after creation (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
6. Every timestamp (`createdAt` on create, `updatedAt` on create/update) MUST equal `request.time`.
7. Every `list` query MUST enforce `resource.data.uid == request.auth.uid` without delegating filtering to the client.
8. Every `create` MUST validate `keys().hasAll(...)` and `keys().hasOnly(...)` to block ghost/shadow fields, and every `update` MUST begin with `isValid[Entity](incoming())` and restrict changed keys via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Creating `/users/u1/studyNotes/n1` with `request.auth == null`.
2. **Unverified Email Write**: Creating `/users/u1/studyNotes/n1` when `request.auth.token.email_verified == false`.
3. **Cross-User Read (PII Leak)**: User `u2` reading `/users/u1/private/info`.
4. **Identity Spoofing on Create**: User `u1` creating `/users/u1/studyNotes/n1` with `{ uid: "u2", ... }`.
5. **Shadow / Ghost Field Injection**: User `u1` creating `/users/u1` with extra `{ isAdmin: true }` or `{ role: "admin" }`.
6. **Update-Gap Value Poisoning**: User `u1` updating `/users/u1/studyNotes/n1` with `content` > 6000 chars or wrong type (`title: 12345`).
7. **Immutable Field Tampering**: User `u1` updating `/users/u1/studyNotes/n1` to alter `createdAt` or `uid`.
8. **Client-Spoofed Timestamp**: User `u1` creating `/users/u1/studyNotes/n1` with `createdAt` != `request.time`.
9. **Path Variable / ID Poisoning**: Creating `/users/u1/studyNotes/bad$id!with*spaces` or > 128-char ID.
10. **Unbounded Array Exhaustion**: Updating `/users/u1/prayerLogs/2026-11-24` with 11 items in `prayedIds` or non-string element `[123]`.
11. **Orphaned Message Creation**: User `u1` creating `/users/u1/chatThreads/nonexistent/messages/m1` when parent thread does not exist.
12. **Blanket List Scraping**: User `u2` executing `list` on `/users/u1/studyNotes` (`resource.data.uid != "u2"`).
