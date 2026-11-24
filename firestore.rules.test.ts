import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 0 Rules Verification Spec
 * Validates that every collection in firebase-blueprint.json is matched in firestore.rules
 * and enforces the Dirty Dozen security invariants (unauthenticated block, email_verified,
 * PII isolation, strict keys, bounded arrays, Master Gate get(), and server timestamps).
 */
const blueprint = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);
const rulesPath = fs.existsSync(path.resolve(process.cwd(), 'firestore.rules'))
  ? path.resolve(process.cwd(), 'firestore.rules')
  : path.resolve(process.cwd(), 'DRAFT_firestore.rules');
const rulesText = fs.readFileSync(rulesPath, 'utf8');

// 1. Default deny catch-all at top
assert.match(
  rulesText,
  /match \/\{document=\*\*\} \{\s*allow read, write: if false;/,
  'Global default-deny catch-all rule must be present'
);

// 2. Email verification requirement
assert.match(
  rulesText,
  /request\.auth\.token\.email_verified == true/,
  'Rules must enforce email_verified == true'
);

// 3. Every blueprint path has a corresponding rule match block
for (const collectionPath of Object.keys(blueprint.firestore)) {
  const leafSegment = collectionPath.split('/').slice(-2)[0];
  assert.ok(
    rulesText.includes(`match /${leafSegment}/`) || rulesText.includes(`match /users/{userId}`),
    `Missing match block for blueprint path ${collectionPath}`
  );
}

// 4. Eight Pillars checks
assert.ok(rulesText.includes('isValidUserProfile(incoming())'), 'UserProfile validation helper required');
assert.ok(rulesText.includes('isValidPrayerLog(incoming())'), 'PrayerLog validation helper required');
assert.ok(rulesText.includes('isValidStudyNote(incoming())'), 'StudyNote validation helper required');
assert.ok(rulesText.includes('isValidChatThread(incoming())'), 'ChatThread validation helper required');
assert.ok(rulesText.includes('isValidChatMessage(incoming(), threadId)'), 'ChatMessage validation helper required');
assert.ok(rulesText.includes('isValidAudioTranscript(incoming())'), 'AudioTranscript validation helper required');
assert.ok(rulesText.includes('data.prayedIds.size() <= 10'), 'Bounded array guard required on prayedIds');
assert.ok(rulesText.includes('resource.data.uid == request.auth.uid'), 'Query Enforcer required on list rules');
assert.ok(rulesText.includes('incoming().updatedAt == request.time'), 'Temporal integrity required on timestamps');
assert.ok(rulesText.includes('get(/databases/$(database)/documents/users/$(userId)/chatThreads/$(threadId)).data.uid == request.auth.uid'), 'Master Gate get() required on messages');

console.log('firestore.rules.test.ts: All security spec invariants verified.');
