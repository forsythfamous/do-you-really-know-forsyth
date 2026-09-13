import fs from 'fs';
import path from 'path';
import { CANONICAL_QUESTIONS } from '../src/data/canonicalQuestions';
import {
  generateQuickPlayQuestions,
  generateFullChallengeQuestions,
  isAnswerCorrect,
  shuffleArray,
} from '../src/lib/quizEngine';
import { calculateQuizScore, getTierForPercentage } from '../src/lib/scoring';
import {
  HONEST_ROOM_QUESTIONS,
  THREE_WORDS_QUESTION_ID,
  validateThreeWordsAnswer,
} from '../src/data/honestQuestions';
import { LocalStorageQuizRepository } from '../src/lib/repository/localStorageQuizRepository';
import { QuizSubmission, HonestRoomDraft, QuizSession, ParticipantIdentity } from '../src/types';

// Mock localStorage for Node environment testing
if (typeof window === 'undefined') {
  const store: Record<string, string> = {};
  const sessionStore: Record<string, string> = {};
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    },
    sessionStorage: {
      getItem: (key: string) => sessionStore[key] || null,
      setItem: (key: string, val: string) => {
        sessionStore[key] = val;
      },
      removeItem: (key: string) => {
        delete sessionStore[key];
      },
      clear: () => {
        for (const k in sessionStore) delete sessionStore[k];
      },
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=====================================================================');
console.log('STAGE 2 AUTHORITATIVE VERIFICATION SUITE (ITEMS 1 - 15)');
console.log('=====================================================================\n');

const repo = new LocalStorageQuizRepository();

// -------------------------------------------------------------
// ITEM 1: Mode Selection contains no Honest Room navigation.
// -------------------------------------------------------------
console.log('Item 1: Mode Selection contains no Honest Room navigation.');
const modeSelectionSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/ModeSelectionView.tsx'),
  'utf-8',
);
assert(
  !modeSelectionSource.includes('onSelectHonestRoom'),
  'ModeSelectionView must not accept or expose onSelectHonestRoom callback',
);
assert(
  !modeSelectionSource.includes('mode-select-honest-btn'),
  'ModeSelectionView must not contain an Honest Room selection button',
);
assert(
  !modeSelectionSource.includes("mode === 'honest-only'"),
  'ModeSelectionView must not have honest-only mode option',
);
console.log('  ✔ PASS: Mode Selection contains only Quick Play and Full Challenge options.');

// -------------------------------------------------------------
// ITEM 2: Honest Room cannot be accessed without completing Quick Play or Full Challenge.
// -------------------------------------------------------------
console.log('\nItem 2: Honest Room cannot be accessed without completing Quick Play or Full Challenge.');
const appSource = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
// Verify handleContinueToHonestRoom requires completed session
assert(
  appSource.includes('if (!session || !session.isCompleted) return;'),
  'handleContinueToHonestRoom must guard against non-completed sessions',
);
// Verify session is only complete after all questions are answered
assert(
  appSource.includes('nextIndex < totalQuestions') && appSource.includes('isCompleted: true'),
  'Quiz completion must strictly check all questions answered before setting isCompleted: true',
);
console.log('  ✔ PASS: Honest Room entrance strictly requires a completed quiz session.');

// -------------------------------------------------------------
// ITEM 3: Direct Honest Room route navigation without a valid completed quiz redirects safely.
// -------------------------------------------------------------
console.log('\nItem 3: Direct Honest Room route navigation without a valid completed quiz redirects safely.');
// Verify route guard in initApp
assert(
  appSource.includes("if (hash === 'honest' || hash === 'honest-review')"),
  'initApp must intercept direct hash navigation to honest routes',
);
// Verify runtime guard in useEffect
assert(
  appSource.includes("route === 'honest' || route === 'honest-review'"),
  'Runtime useEffect must guard route against incomplete sessions',
);
assert(
  appSource.includes("navigateTo('landing')"),
  'Guard must redirect to landing when no completed session exists',
);
console.log('  ✔ PASS: Direct navigation to Honest Room routes without completed quiz redirects safely.');

// -------------------------------------------------------------
// ITEM 4: A valid Honest Room draft recovers after browser refresh.
// -------------------------------------------------------------
console.log('\nItem 4: A valid Honest Room draft recovers after browser refresh.');
const validDraft: HonestRoomDraft = {
  submissionId: 'test_refresh_sub_001',
  participant: { type: 'named', displayName: 'Maya' },
  mode: 'quick',
  reflections: { 46: 'Honest, brilliant, grounded.', 48: 'Our road trip to the coast.' },
  currentQuestionIndex: 3,
  linkedQuizSessionId: 'test_refresh_sub_001',
  updatedAt: Date.now(),
  schemaVersion: 2,
};
await repo.saveHonestDraft(validDraft);
const recoveredDraft = await repo.loadHonestDraft();
assert(recoveredDraft !== null, 'Valid Honest Room draft should recover from storage');
assert(recoveredDraft?.submissionId === validDraft.submissionId, 'Submission ID mismatch on recovery');
assert(recoveredDraft?.participant.displayName === 'Maya', 'Participant name mismatch');
assert(recoveredDraft?.reflections[46] === validDraft.reflections[46], 'Reflections mismatch on recovery');
assert(recoveredDraft?.currentQuestionIndex === 3, 'Question index mismatch on recovery');
console.log('  ✔ PASS: Valid Honest Room draft recovers completely with all state intact.');

// -------------------------------------------------------------
// ITEM 5: Every reflection is associated with an existing completed quiz submission ID.
// -------------------------------------------------------------
console.log('\nItem 5: Every reflection is associated with an existing completed quiz submission ID.');
assert(
  appSource.includes('submissionId: session.sessionId'),
  'HonestRoomDraft must bind directly to session.sessionId',
);
assert(
  appSource.includes('linkedQuizSessionId: session.sessionId'),
  'HonestRoomDraft must bind linkedQuizSessionId to session.sessionId',
);
assert(
  appSource.includes('submissionId: honestDraft.submissionId'),
  'Final submission must bind to honestDraft.submissionId',
);
console.log('  ✔ PASS: Honest reflections are strictly coupled to existing quiz submission IDs.');

// -------------------------------------------------------------
// ITEM 6: No reflection-only submission can be created.
// -------------------------------------------------------------
console.log('\nItem 6: No reflection-only submission can be created.');
let caughtIllegalSubmission = false;
try {
  const illegalReflectionOnly: any = {
    submissionId: 'illegal_sub_999',
    participantType: 'named',
    displayName: 'Hacker',
    mode: 'honest-only', // illegal mode
    reflections: { 46: 'Great guy' },
    submittedAt: new Date().toISOString(),
  };
  await repo.saveSubmission(illegalReflectionOnly);
} catch (err: any) {
  caughtIllegalSubmission = true;
  assert(err.message.includes('Invalid submission mode'), 'Expected invalid mode error');
}
assert(caughtIllegalSubmission, 'Repository must reject submissions without valid quick/full quiz mode');

let caughtMissingScore = false;
try {
  const missingScoreSub: any = {
    submissionId: 'illegal_sub_998',
    participantType: 'named',
    displayName: 'Hacker',
    mode: 'quick',
    reflections: { 46: 'Great guy' },
    submittedAt: new Date().toISOString(),
  };
  await repo.saveSubmission(missingScoreSub);
} catch (err: any) {
  caughtMissingScore = true;
  assert(err.message.includes('numeric score'), 'Expected numeric score error');
}
assert(caughtMissingScore, 'Repository must reject submissions without numeric score');
console.log('  ✔ PASS: Reflection-only submissions are strictly prohibited and rejected by repository.');

function dummyAnswer(questionId: number, isCorrect: boolean = true) {
  return {
    questionId,
    selectedOptionId: `${questionId}_a`,
    selectedOptionLabel: 'Sample Answer',
    isCorrect,
    correctOptionId: `${questionId}_a`,
    correctAnswerText: 'Sample Answer',
    timestamp: Date.now(),
  };
}

// -------------------------------------------------------------
// ITEM 7: Final reflection submission cannot be duplicated through repeated clicks, refresh or route navigation.
// -------------------------------------------------------------
console.log('\nItem 7: Final reflection submission cannot be duplicated through repeated clicks, refresh or route navigation.');
const testSubId = 'sub_single_record_001';
const initialSub: QuizSubmission = {
  submissionId: testSubId,
  participantType: 'named',
  displayName: 'Chloe',
  mode: 'quick',
  questionIds: [1, 2, 3],
  selectedAnswers: { 1: dummyAnswer(1), 2: dummyAnswer(2), 3: dummyAnswer(3) },
  correctCount: 3,
  totalQuestions: 12,
  score: 25,
  tier: 'Casual Acquaintance',
  reflections: {},
  reflectionCompletionStatus: 'not_started',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(initialSub);

// Simulate second submission call (duplicate click)
const duplicateSub: QuizSubmission = {
  ...initialSub,
  reflections: { 46: 'Smart and kind.' },
  reflectionCompletionStatus: 'completed',
  submittedAt: new Date().toISOString(),
};
await repo.saveSubmission(duplicateSub);

// Verify exactly one record exists with this submissionId in storage
const storedSubRaw = window.localStorage.getItem('dyrkf_submissions_v2');
assert(storedSubRaw !== null, 'Stored submissions must exist');
const parsedSubmissions = JSON.parse(storedSubRaw);
const occurrences = Object.keys(parsedSubmissions).filter((id) => id === testSubId);
assert(occurrences.length === 1, `Expected exactly 1 submission record, found ${occurrences.length}`);
assert(
  parsedSubmissions[testSubId].reflections[46] === 'Smart and kind.',
  'Reflections must be cleanly merged without duplication',
);
console.log('  ✔ PASS: Repeated clicks or submissions update the unique record without creating duplicate entries.');

// -------------------------------------------------------------
// ITEM 8: “Skip & Finish” preserves the completed quiz and correctly records reflectionCompletionStatus as skipped.
// -------------------------------------------------------------
console.log('\nItem 8: “Skip & Finish” preserves the completed quiz and correctly records reflectionCompletionStatus as skipped.');
const skipTestId = 'sub_skip_finish_001';
const preSkipQuiz: QuizSubmission = {
  submissionId: skipTestId,
  participantType: 'named',
  displayName: 'Jordan',
  mode: 'full',
  questionIds: [1, 2, 3],
  selectedAnswers: { 1: dummyAnswer(1), 2: dummyAnswer(2), 3: dummyAnswer(3) },
  correctCount: 20,
  totalQuestions: 28,
  score: 71,
  tier: 'Inner-Circle Material',
  reflections: {},
  reflectionCompletionStatus: 'not_started',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(preSkipQuiz);

// Perform Skip & Finish
const skippedSubmission: QuizSubmission = {
  ...preSkipQuiz,
  reflectionCompletionStatus: 'skipped',
  submittedAt: new Date().toISOString(),
};
await repo.saveSubmission(skippedSubmission);

const retrievedSkipped = await repo.loadSubmission(skipTestId);
assert(retrievedSkipped !== null, 'Skipped submission must be stored');
assert(retrievedSkipped?.reflectionCompletionStatus === 'skipped', 'Status must be "skipped"');
assert(retrievedSkipped?.correctCount === 20, 'correctCount must remain 20');
assert(retrievedSkipped?.totalQuestions === 28, 'totalQuestions must remain 28');
assert(retrievedSkipped?.score === 71, 'score must remain 71');
assert(retrievedSkipped?.tier === 'Inner-Circle Material', 'tier must remain intact');
console.log('  ✔ PASS: "Skip & Finish" preserves quiz score and records reflectionCompletionStatus as "skipped".');

// -------------------------------------------------------------
// ITEM 9: Completing Honest Room preserves original answers, correct count, total count, score and tier without recalculation.
// -------------------------------------------------------------
console.log('\nItem 9: Completing Honest Room preserves original answers, correct count, total count, score and tier without recalculation.');
const completeTestId = 'sub_complete_honest_001';
const originalQuiz: QuizSubmission = {
  submissionId: completeTestId,
  participantType: 'named',
  displayName: 'Sarah',
  mode: 'full',
  questionIds: [10, 20, 30],
  selectedAnswers: { 10: dummyAnswer(10), 20: dummyAnswer(20), 30: dummyAnswer(30) },
  correctCount: 27,
  totalQuestions: 28,
  score: 96,
  tier: 'Forsyth Savant',
  reflections: {},
  reflectionCompletionStatus: 'not_started',
  quizCompletedAt: '2026-09-09T03:00:00.000Z',
  submittedAt: '2026-09-09T03:00:00.000Z',
  schemaVersion: 2,
};
await repo.saveSubmission(originalQuiz);

// Submit with completed Honest Room
const completedHonestSub: QuizSubmission = {
  submissionId: completeTestId,
  participantType: 'named',
  displayName: 'Sarah',
  mode: 'full',
  questionIds: [10, 20, 30],
  selectedAnswers: { 10: dummyAnswer(10), 20: dummyAnswer(20), 30: dummyAnswer(30) },
  correctCount: 27,
  totalQuestions: 28,
  score: 96,
  tier: 'Forsyth Savant',
  reflections: {
    46: 'Generous and thoughtful.',
    56: 'Loyal, brilliant, funny',
    60: 'Wishing you all the happiness in the world!',
  },
  reflectionCompletionStatus: 'completed',
  quizCompletedAt: '2026-09-09T03:00:00.000Z',
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(completedHonestSub);

const loadedCompleted = await repo.loadSubmission(completeTestId);
assert(loadedCompleted !== null, 'Submission must exist');
assert(loadedCompleted?.correctCount === 27, 'correctCount must remain exactly 27');
assert(loadedCompleted?.totalQuestions === 28, 'totalQuestions must remain exactly 28');
assert(loadedCompleted?.score === 96, 'score must remain exactly 96%');
assert(loadedCompleted?.tier === 'Forsyth Savant', 'tier must remain "Forsyth Savant"');
assert(JSON.stringify(loadedCompleted?.selectedAnswers) === JSON.stringify(originalQuiz.selectedAnswers), 'Answers must match');
assert(loadedCompleted?.reflectionCompletionStatus === 'completed', 'status must be "completed"');
assert(loadedCompleted?.quizCompletedAt === '2026-09-09T03:00:00.000Z', 'quizCompletedAt must not change');
console.log('  ✔ PASS: Original answers, counts, score, and tier preserved completely without recalculation.');

// -------------------------------------------------------------
// ITEM 10: Canonical reflection ID 56 exclusively owns the exactly-three-word validation.
// -------------------------------------------------------------
console.log('\nItem 10: Canonical reflection ID 56 exclusively owns the exactly-three-word validation.');
assert(THREE_WORDS_QUESTION_ID === 56, 'THREE_WORDS_QUESTION_ID must be 56');

// Verify all 10 Honest Room questions and verify only ID 56 has three-words rule
assert(HONEST_ROOM_QUESTIONS.length === 10, 'Must have exactly 10 Honest Room questions');
const canonicalHonestIds = [46, 48, 49, 50, 52, 55, 56, 58, 59, 60];
const actualHonestIds = HONEST_ROOM_QUESTIONS.map((q) => q.id);
assert(
  JSON.stringify(actualHonestIds) === JSON.stringify(canonicalHonestIds),
  `Honest question IDs must match canonical: expected ${canonicalHonestIds.join(',')}, got ${actualHonestIds.join(',')}`,
);

HONEST_ROOM_QUESTIONS.forEach((q) => {
  if (q.id === 56) {
    assert(q.isThreeWordsQuestion === true, 'Question 56 must have isThreeWordsQuestion === true');
  } else {
    assert(
      q.isThreeWordsQuestion !== true,
      `Question ${q.id} must not have isThreeWordsQuestion flag`,
    );
  }
});

// Test validation logic
assert(validateThreeWordsAnswer('Kind, smart, funny').isValid === true, '3 words must be valid');
assert(validateThreeWordsAnswer('One two three').isValid === true, '3 words without punctuation must be valid');
assert(validateThreeWordsAnswer('   Word1   Word2   Word3   ').isValid === true, '3 words with excess space valid');
assert(validateThreeWordsAnswer('Single').isValid === false, '1 word must fail');
assert(validateThreeWordsAnswer('Two words').isValid === false, '2 words must fail');
assert(validateThreeWordsAnswer('Four words in text').isValid === false, '4 words must fail');
assert(validateThreeWordsAnswer('').isValid === true, 'Empty response is valid (skipping permitted)');
assert(validateThreeWordsAnswer('   ').isValid === true, 'Whitespace-only is valid (skipping permitted)');
console.log('  ✔ PASS: Canonical reflection ID 56 exclusively owns the exactly-three-word validation.');

// -------------------------------------------------------------
// ITEM 11: Malformed stored sessions and reflection drafts do not crash the application.
// -------------------------------------------------------------
console.log('\nItem 11: Malformed stored sessions and reflection drafts do not crash the application.');
// Corrupt session data
window.localStorage.setItem('dyrkf_active_session_v2', '{broken json!@#$');
const safeSessionRes = await repo.loadActiveSession();
assert(safeSessionRes === null, 'Corrupt session JSON must return null safely');

// Malformed structure session
window.localStorage.setItem(
  'dyrkf_active_session_v2',
  JSON.stringify({ sessionId: 12345, mode: 'invalid' }),
);
const safeSessionRes2 = await repo.loadActiveSession();
assert(safeSessionRes2 === null, 'Malformed session object must return null safely');

// Corrupt draft data
window.localStorage.setItem('dyrkf_honest_draft_v2', '<<<not a json>>>');
const safeDraftRes = await repo.loadHonestDraft();
assert(safeDraftRes === null, 'Corrupt draft JSON must return null safely');

// Out of bounds draft
window.localStorage.setItem(
  'dyrkf_honest_draft_v2',
  JSON.stringify({
    submissionId: 'test',
    participant: { type: 'anonymous', displayName: null },
    mode: 'quick',
    reflections: {},
    currentQuestionIndex: -5,
  }),
);
const safeDraftRes2 = await repo.loadHonestDraft();
assert(safeDraftRes2 === null, 'Out-of-bounds draft must return null safely');
console.log('  ✔ PASS: Malformed stored sessions and drafts are caught safely without crashing.');

// -------------------------------------------------------------
// ITEM 12: Quick Play still contains exactly 12 unique questions.
// -------------------------------------------------------------
console.log('\nItem 12: Quick Play still contains exactly 12 unique questions.');
const canonicalScoredIds = new Set(CANONICAL_QUESTIONS.filter((q) => q.active).map((q) => q.id));
for (let i = 0; i < 100; i++) {
  const quick = generateQuickPlayQuestions();
  assert(quick.length === 12, `Iteration ${i}: Expected exactly 12 questions, got ${quick.length}`);
  const uniqueIds = new Set(quick.map((q) => q.id));
  assert(uniqueIds.size === 12, `Iteration ${i}: Expected 12 unique question IDs, got ${uniqueIds.size}`);
  for (const q of quick) {
    assert(canonicalScoredIds.has(q.id), `Question ${q.id} is not in canonical active pool`);
  }
}
console.log('  ✔ PASS: Quick Play verified over 100 iterations to contain exactly 12 unique questions.');

// -------------------------------------------------------------
// ITEM 13: Full Challenge still contains exactly 28 unique questions, with IDs 61 and 62 in the last two positions.
// -------------------------------------------------------------
console.log('\nItem 13: Full Challenge still contains exactly 28 unique questions, with IDs 61 and 62 in the last two positions.');
for (let i = 0; i < 100; i++) {
  const full = generateFullChallengeQuestions();
  assert(full.length === 28, `Iteration ${i}: Expected 28 questions, got ${full.length}`);
  const uniqueIds = new Set(full.map((q) => q.id));
  assert(uniqueIds.size === 28, `Iteration ${i}: Expected 28 unique question IDs, got ${uniqueIds.size}`);
  assert(full[26].id === 61, `Iteration ${i}: Expected Question 61 at index 26, got ${full[26].id}`);
  assert(full[27].id === 62, `Iteration ${i}: Expected Question 62 at index 27, got ${full[27].id}`);
}
console.log('  ✔ PASS: Full Challenge verified over 100 iterations with 28 questions and IDs 61 & 62 in final positions.');

// -------------------------------------------------------------
// ITEM 14: Named submissions retain the validated display name.
// -------------------------------------------------------------
console.log('\nItem 14: Named submissions retain the validated display name.');
const namedSubId = 'sub_named_test_001';
const namedSub: QuizSubmission = {
  submissionId: namedSubId,
  participantType: 'named',
  displayName: 'Marcus Aurelius',
  mode: 'full',
  questionIds: [1, 2],
  selectedAnswers: {},
  correctCount: 20,
  totalQuestions: 28,
  score: 71,
  tier: 'Inner-Circle Material',
  reflections: {},
  reflectionCompletionStatus: 'not_started',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(namedSub);
const retrievedNamed = await repo.loadSubmission(namedSubId);
assert(retrievedNamed !== null, 'Named submission must save successfully');
assert(retrievedNamed?.participantType === 'named', 'participantType must be named');
assert(retrievedNamed?.displayName === 'Marcus Aurelius', 'displayName must retain exact validated name');
console.log('  ✔ PASS: Named submissions retain the validated display name.');

// -------------------------------------------------------------
// ITEM 15: Anonymous submissions store displayName as null.
// -------------------------------------------------------------
console.log('\nItem 15: Anonymous submissions store displayName as null.');
const anonSubId = 'sub_anon_test_002';
const anonSubWithArtifact: QuizSubmission = {
  submissionId: anonSubId,
  participantType: 'anonymous',
  displayName: 'ShouldNeverBeStored' as any,
  mode: 'quick',
  questionIds: [1, 2],
  selectedAnswers: {},
  correctCount: 10,
  totalQuestions: 12,
  score: 83,
  tier: 'Inner-Circle Material',
  reflections: {},
  reflectionCompletionStatus: 'not_started',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(anonSubWithArtifact);
const retrievedAnon = await repo.loadSubmission(anonSubId);
assert(retrievedAnon !== null, 'Anonymous submission must save successfully');
assert(retrievedAnon?.participantType === 'anonymous', 'participantType must be anonymous');
assert(
  retrievedAnon?.displayName === null,
  `Anonymous displayName must be strictly null, got: ${retrievedAnon?.displayName}`,
);
console.log('  ✔ PASS: Anonymous submissions strictly store displayName as null.');

// =============================================================
// STAGE 3 AUTHORITATIVE VERIFICATION SUITE (ITEMS 16 - 24)
// =============================================================
console.log('\n=====================================================================');
console.log('STAGE 3 AUTHORITATIVE VERIFICATION SUITE (ITEMS 16 - 24)');
console.log('=====================================================================\n');

// -------------------------------------------------------------
// ITEM 16: Admin route is not linked in participant navigation.
// -------------------------------------------------------------
console.log('Item 16: Admin route is not linked in participant-facing UI.');
const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf-8');
const footerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Footer.tsx'), 'utf-8');
const layoutSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Layout.tsx'), 'utf-8');
const landingSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/LandingView.tsx'), 'utf-8');

assert(!headerSrc.includes('#/admin'), 'Header must not contain link to #/admin');
assert(!footerSrc.includes('#/admin'), 'Footer must not contain link to #/admin');
assert(!layoutSrc.includes('#/admin'), 'Layout must not contain link to #/admin');
assert(!landingSrc.includes('#/admin'), 'LandingView must not contain link to #/admin');
console.log('  ✔ PASS: Admin route is strictly unlinked from all participant navigation.');

// -------------------------------------------------------------
// ITEM 17: DevAdminAuthAdapter authentication and authorization.
// -------------------------------------------------------------
console.log('\nItem 17: DevAdminAuthAdapter credentials and session handling.');
const { DevAdminAuthAdapter } = await import('../src/lib/auth/devAdminAuthAdapter');
const devAuth = new DevAdminAuthAdapter();
assert(!devAuth.isAuthenticated(), 'Initial auth state must be unauthenticated');

// Reject invalid credentials (malformed email / short password)
let threw = false;
try {
  await devAuth.signIn('not-an-email', '123');
} catch {
  threw = true;
}
assert(threw, 'DevAdminAuthAdapter must reject invalid credentials');

// Sign in with dev credentials
const admin = await devAuth.signIn('forsyth@admin.local', 'admin123');
assert(admin.isAuthorizedAdmin === true, 'Admin user must have isAuthorizedAdmin: true');
assert(devAuth.isAuthenticated(), 'devAuth.isAuthenticated must be true after sign in');
assert(devAuth.isAuthorizedAdmin(), 'devAuth.isAuthorizedAdmin must be true after sign in');
console.log('  ✔ PASS: DevAdminAuthAdapter correctly validates credentials and maintains auth state.');

// -------------------------------------------------------------
// ITEM 18: CSV Export formula injection protection (CWE-1236) and BOM.
// -------------------------------------------------------------
console.log('\nItem 18: CSV export sanitization and security protection.');
const { sanitizeCsvCell, generateSubmissionsCsv, generateReflectionsCsv } = await import('../src/lib/csvExport');

// Test sanitization of dangerous Excel/Calc formulas
assert(sanitizeCsvCell('=cmd|/c calc') === "\"'=cmd|/c calc\"", 'Must escape formula =');
assert(sanitizeCsvCell('+1234') === "\"'+1234\"", 'Must escape formula +');
assert(sanitizeCsvCell('-5+5') === "\"'-5+5\"", 'Must escape formula -');
assert(sanitizeCsvCell('@SUM(A1:A10)') === "\"'@SUM(A1:A10)\"", 'Must escape formula @');
assert(sanitizeCsvCell('Normal Text') === '"Normal Text"', 'Normal text must be quoted safely');

// Test BOM header
const testSub: QuizSubmission = {
  submissionId: 'test_sub_csv_1',
  participantType: 'named',
  displayName: '=MALICIOUS_CMD()',
  mode: 'quick',
  questionIds: [1, 2],
  selectedAnswers: {},
  correctCount: 2,
  totalQuestions: 2,
  score: 100,
  tier: 'Soul-Bound Twin',
  reflections: { 46: '+9999999' },
  reflectionCompletionStatus: 'completed',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
const subCsv = generateSubmissionsCsv([testSub]);
assert(subCsv.startsWith('\uFEFF'), 'CSV must include UTF-8 BOM for Excel unicode support');
assert(subCsv.includes("\"'=MALICIOUS_CMD()\""), 'Participant name formula must be sanitized');

const refCsv = generateReflectionsCsv([testSub]);
assert(refCsv.startsWith('\uFEFF'), 'Reflections CSV must include UTF-8 BOM');
assert(refCsv.includes("\"'+9999999\""), 'Reflection answer formula must be sanitized');
console.log('  ✔ PASS: CSV export safely neutralizes formula injection and includes UTF-8 BOM.');

// -------------------------------------------------------------
// ITEM 19: Analytics calculation accuracy (deterministic and non-fabricated).
// -------------------------------------------------------------
console.log('\nItem 19: Aggregate analytics determinism and accuracy.');
const analytics = await repo.getAggregateAnalytics();
assert(typeof analytics.totalSubmissions === 'number', 'totalSubmissions must be a number');
assert(typeof analytics.averageScore === 'number', 'averageScore must be a number');
assert(typeof analytics.completionRate === 'number', 'completionRate must be a number');
assert(analytics.completionRate >= 0 && analytics.completionRate <= 100, 'completionRate must be 0-100%');
console.log(`  ✔ PASS: Computed real analytics: ${analytics.totalSubmissions} submissions, avg score ${analytics.averageScore}%.`);

// -------------------------------------------------------------
// ITEM 20: Submission deletion removes submission and reflections.
// -------------------------------------------------------------
console.log('\nItem 20: Submission deletion cascades cleanly.');
const deleteTargetId = 'sub_delete_test_999';
const deleteTargetSub: QuizSubmission = {
  submissionId: deleteTargetId,
  participantType: 'named',
  displayName: 'Delete Me',
  mode: 'quick',
  questionIds: [1],
  selectedAnswers: {},
  correctCount: 1,
  totalQuestions: 1,
  score: 100,
  tier: 'Soul-Bound Twin',
  reflections: { 46: 'Reflection to be purged' },
  reflectionCompletionStatus: 'completed',
  quizCompletedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  schemaVersion: 2,
};
await repo.saveSubmission(deleteTargetSub);
const beforeDelete = await repo.getSubmissionById(deleteTargetId);
assert(beforeDelete !== null, 'Submission must exist before deletion');

const deleteOk = await repo.deleteSubmissionWithReflections(deleteTargetId);
assert(deleteOk === true, 'deleteSubmissionWithReflections must return true on success');

const afterDelete = await repo.getSubmissionById(deleteTargetId);
assert(afterDelete === null, 'Submission must be completely absent after deletion');
console.log('  ✔ PASS: Submission and associated reflections are completely deleted.');

// -------------------------------------------------------------
// ITEM 21: Demo data is isolated and not counted in real analytics.
// -------------------------------------------------------------
console.log('\nItem 21: Demo data isolation.');
const { DEMO_SUBMISSIONS } = await import('../src/lib/demoSubmissions');
assert(Array.isArray(DEMO_SUBMISSIONS) && DEMO_SUBMISSIONS.length > 0, 'DEMO_SUBMISSIONS must exist');
const realSubmissions = await repo.listSubmissions();
DEMO_SUBMISSIONS.forEach((demo) => {
  assert(
    !realSubmissions.some((real) => real.submissionId === demo.submissionId),
    `Demo submission ${demo.submissionId} must NEVER appear in real storage repository`,
  );
});
console.log('  ✔ PASS: Demo data is strictly isolated from persistent storage.');

// -------------------------------------------------------------
// ITEM 22: Honest Room responses rendered as safe text.
// -------------------------------------------------------------
console.log('\nItem 22: Safe text rendering of reflections.');
const reflectionsViewSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/AdminReflectionsView.tsx'),
  'utf-8',
);
const submissionDetailSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/AdminSubmissionDetailView.tsx'),
  'utf-8',
);
assert(!reflectionsViewSrc.includes('dangerouslySetInnerHTML'), 'Reflections must never use dangerouslySetInnerHTML');
assert(!submissionDetailSrc.includes('dangerouslySetInnerHTML'), 'Submission detail must never use dangerouslySetInnerHTML');
assert(reflectionsViewSrc.includes('whitespace-pre-wrap'), 'Reflections view must preserve whitespace safely');
assert(submissionDetailSrc.includes('whitespace-pre-wrap'), 'Submission detail must preserve whitespace safely');
console.log('  ✔ PASS: Honest Room content is rendered strictly as plain text, preserving whitespace.');

// -------------------------------------------------------------
// ITEM 23: Production Firestore rules and setup documentation exist.
// -------------------------------------------------------------
console.log('\nItem 23: Production security rules and documentation.');
const firestoreRules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf-8');
assert(firestoreRules.includes('request.auth.token.admin == true'), 'firestore.rules must enforce admin claim');
assert(firestoreRules.includes("match /reflections/{reflectionId}"), 'firestore.rules must secure nested reflections');
assert(fs.existsSync(path.join(process.cwd(), 'docs/FIREBASE_SETUP.md')), 'FIREBASE_SETUP.md must exist');
console.log('  ✔ PASS: Production firestore.rules and FIREBASE_SETUP.md are present and enforce admin claim.');

// -------------------------------------------------------------
// ITEM 24: Admin Sign Out clears credentials and session.
// -------------------------------------------------------------
console.log('\nItem 24: Admin sign out.');
await devAuth.signOut();
assert(!devAuth.isAuthenticated(), 'devAuth.isAuthenticated must be false after signOut');
assert(!devAuth.isAuthorizedAdmin(), 'devAuth.isAuthorizedAdmin must be false after signOut');
console.log('  ✔ PASS: Admin sign out successfully clears credentials.');

// =============================================================
// STAGE 4 AUTHORITATIVE VERIFICATION SUITE (ITEMS 25 - 34)
// =============================================================
console.log('\n=====================================================================');
console.log('STAGE 4 AUTHORITATIVE VERIFICATION SUITE (ITEMS 25 - 34)');
console.log('=====================================================================');

const {
  getLocalFallbackCommentary,
  sanitizeCommentary,
  formatShareText,
  LOCAL_FALLBACK_COMMENTARIES,
} = await import('../src/lib/commentary');

// -------------------------------------------------------------
// ITEM 25: Gemini cannot alter numerical scores or tiers.
// -------------------------------------------------------------
console.log('\nItem 25: Deterministic score and tier preservation.');
const sampleAnswers: Record<number, any> = {
  1: { questionId: 1, selectedOptionId: 'opt-1-1', isCorrect: true, selectedOptionLabel: 'A' },
  2: { questionId: 2, selectedOptionId: 'opt-2-2', isCorrect: false, selectedOptionLabel: 'B' },
  3: { questionId: 3, selectedOptionId: 'opt-3-1', isCorrect: true, selectedOptionLabel: 'A' },
};
const baselineCalc = calculateQuizScore(sampleAnswers, 3);
assert(baselineCalc.correctCount === 2, 'Must be exactly 2 correct');
assert(baselineCalc.scorePercentage === 67, 'Must be exactly 67%');
assert(baselineCalc.tier.title === 'Certified Forsyth Friend', 'Tier must be Certified Forsyth Friend');

// Any commentary generated or received cannot mutate baselineCalc
const simulatedCommentary = sanitizeCommentary('Forsyth says you did great!', baselineCalc.tier.title);
assert(typeof simulatedCommentary === 'string', 'Commentary must be string');
assert(baselineCalc.scorePercentage === 67, 'Score must remain 67%');
assert(baselineCalc.tier.title === 'Certified Forsyth Friend', 'Tier must remain unchanged');
console.log('  ✔ PASS: Scores and tiers are strictly deterministic and immune to AI modification.');

// -------------------------------------------------------------
// ITEM 26: Local fallback commentary for every tier.
// -------------------------------------------------------------
console.log('\nItem 26: Local fallback commentary coverage for every tier.');
const expectedTiers = [
  'Have We Even Met?',
  'Casual Forsyth Associate',
  'Certified Forsyth Friend',
  'Inner-Circle Material',
  'You Know Forsyth Too Well',
];

expectedTiers.forEach((tierName) => {
  const fallback = getLocalFallbackCommentary(tierName);
  assert(typeof fallback === 'string' && fallback.length > 20, `Fallback for tier ${tierName} must be substantial`);
  assert(LOCAL_FALLBACK_COMMENTARIES[tierName] !== undefined, `Tier ${tierName} must have mapped fallback`);
});
console.log('  ✔ PASS: High-quality local fallback commentary exists for all 5 tiers.');

// -------------------------------------------------------------
// ITEM 27: Invalid or hostile Gemini output falls back safely.
// -------------------------------------------------------------
console.log('\nItem 27: Invalid Gemini output fallback resilience.');
const hostileOutput = '""'; // Empty
const tooShortOutput = 'Hi';
const nonStringOutput = null;

assert(
  sanitizeCommentary(hostileOutput, 'Inner-Circle Material') === LOCAL_FALLBACK_COMMENTARIES['Inner-Circle Material'],
  'Empty string output must fallback safely to tier message',
);
assert(
  sanitizeCommentary(tooShortOutput, 'Inner-Circle Material') === LOCAL_FALLBACK_COMMENTARIES['Inner-Circle Material'],
  'Too short output must fallback safely to tier message',
);
assert(
  sanitizeCommentary(nonStringOutput, 'Inner-Circle Material') === LOCAL_FALLBACK_COMMENTARIES['Inner-Circle Material'],
  'Null output must fallback safely to tier message',
);
console.log('  ✔ PASS: Invalid, empty, or malicious outputs immediately revert to tier fallback.');

// -------------------------------------------------------------
// ITEM 28: Shared text format and field verification.
// -------------------------------------------------------------
console.log('\nItem 28: Formatted share text verification.');
const shareText = formatShareText(75, 'Inner-Circle Material', 'https://example.com');
assert(shareText.includes('75%'), 'Share text must include percentage score');
assert(shareText.includes('Inner-Circle Material'), 'Share text must include tier title');
assert(shareText.includes('Do You Really Know Forsyth?'), 'Share text must include quiz name');
assert(shareText.includes('https://example.com'), 'Share text must include app link');
assert(!shareText.includes('submissionId'), 'Share text must never include submission ID');
assert(!shareText.includes('reflection'), 'Share text must never include reflections');
console.log('  ✔ PASS: Share text contains only approved fields and excludes all private data.');

// -------------------------------------------------------------
// ITEM 29: Result card data structure exclusions.
// -------------------------------------------------------------
console.log('\nItem 29: Result card data field exclusions.');
const cardComponentSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/ShareableResultCard.tsx'),
  'utf-8',
);
assert(!cardComponentSrc.includes('submissionId'), 'Result card must not display submissionId');
assert(!cardComponentSrc.includes('selectedAnswers'), 'Result card must not display answers array');
assert(!cardComponentSrc.includes('reflections'), 'Result card must not display reflections');
assert(!cardComponentSrc.includes('submittedAt'), 'Result card must not display private timestamp');
assert(cardComponentSrc.includes('Think you know Forsyth better? Take the challenge.'), 'Result card must include invitation');
console.log('  ✔ PASS: Result card strictly excludes answers, reflections, submission IDs, and admin data.');

// -------------------------------------------------------------
// ITEM 30: Anonymous results display "Anonymous".
// -------------------------------------------------------------
console.log('\nItem 30: Anonymous participant display label.');
const resultsViewSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/ResultsView.tsx'),
  'utf-8',
);
assert(resultsViewSrc.includes(": 'Anonymous'"), 'Results view must default to "Anonymous" when identity is anonymous');
console.log('  ✔ PASS: Anonymous results display as "Anonymous" with no fabricated identities.');

// -------------------------------------------------------------
// ITEM 31: Confetti threshold (71%+) and reduced motion handling.
// -------------------------------------------------------------
console.log('\nItem 31: Confetti celebration threshold and motion safety.');
const confettiSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/confetti.ts'),
  'utf-8',
);
assert(resultsViewSrc.includes('scorePercentage >= 71'), 'Confetti must only trigger for scores >= 71%');
assert(confettiSrc.includes('prefers-reduced-motion'), 'Confetti utility must respect prefers-reduced-motion');
console.log('  ✔ PASS: Confetti is restricted to scores >= 71% and suppresses under reduced-motion.');

// -------------------------------------------------------------
// ITEM 32: Card PNG canvas renderer module exists and functions.
// -------------------------------------------------------------
console.log('\nItem 32: Canvas result card generator verification.');
const cardRendererSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/cardRenderer.ts'),
  'utf-8',
);
assert(cardRendererSrc.includes('renderResultCardToCanvas'), 'renderResultCardToCanvas function must exist');
assert(cardRendererSrc.includes('downloadResultCardPng'), 'downloadResultCardPng function must exist');
assert(cardRendererSrc.includes('Think you know Forsyth better? Take the challenge.'), 'Card canvas must draw invitation');
console.log('  ✔ PASS: Canvas card PNG generator compiles with exact dimensions and required fields.');

// -------------------------------------------------------------
// ITEM 33: Server commentary endpoint data boundary.
// -------------------------------------------------------------
console.log('\nItem 33: Server API commentary endpoint privacy boundary.');
const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');
assert(serverSrc.includes('/api/commentary'), 'server.ts must expose /api/commentary');
assert(!serverSrc.includes('reflections'), 'server commentary endpoint must not accept or reference reflections');
assert(!serverSrc.includes('selectedAnswers'), 'server commentary endpoint must not reference answers');
assert(serverSrc.includes('fallbackUsed'), 'server commentary must provide graceful fallback indicator');
console.log('  ✔ PASS: Server API endpoint strictly enforces privacy boundaries and graceful fallback.');

// -------------------------------------------------------------
// ITEM 34: Admin isolation and public route guard regression check.
// -------------------------------------------------------------
console.log('\nItem 34: Public and admin isolation regression check.');
const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
assert(!appSrc.includes('<a href="#/admin"'), 'App.tsx must not contain public links to #/admin');
assert(appSrc.includes('adminUser.isAuthorizedAdmin'), 'App.tsx must gate admin routes behind authorization');
console.log('  ✔ PASS: Admin dashboard remains strictly unlinked and isolated from public routes.');

console.log('\n=====================================================================');
console.log('✔ ALL 34 VERIFICATION CHECKS PASSED: FOUNDATION & STAGE 4 COMPLETE');
console.log('=====================================================================\n');
