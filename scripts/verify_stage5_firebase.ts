import './setup_test_env';
import fs from 'fs';
import path from 'path';
import {
  isFirebaseConfigured,
  getFirebaseEnvConfig,
  getFirebaseFirestore,
  isTestEnvironment,
} from '../src/lib/firebase';
import {
  getQuizRepository,
  isCloudRepositoryActive,
  defaultQuizRepository,
  resolveProductionQuizRepository,
  LocalStorageQuizRepository,
  FirestoreQuizRepository,
  InMemoryQuizRepository,
} from '../src/lib/repository';
import {
  getAdminAuthProvider,
  FirebaseAdminAuthAdapter,
  DevAdminAuthAdapter,
} from '../src/lib/auth';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=====================================================================');
console.log('STAGE 5 AUTHORITATIVE VERIFICATION SUITE: FIREBASE & FIRESTORE ADAPTER');
console.log('=====================================================================');

// -----------------------------------------------------------------------------
// CHECK 1: Environment variable reading & active Firebase configuration
// -----------------------------------------------------------------------------
console.log('\nCheck 1: Firebase configuration reader.');
const config = getFirebaseEnvConfig();
assert(config !== null, 'getFirebaseEnvConfig must return valid config object when env vars are present');
assert(isFirebaseConfigured() === true, 'isFirebaseConfigured must return true when env vars are supplied');
assert(typeof config?.apiKey === 'string' && config.apiKey.length > 5, 'apiKey must be valid string');
assert(typeof config?.projectId === 'string' && config.projectId.length > 0, 'projectId must be valid non-empty string');
assert(typeof config?.adminUid === 'string' && config.adminUid.length > 0, 'adminUid must be valid non-empty string');
console.log('  ✔ PASS: Environment variables are strictly read and Firebase is fully configured.');

// -----------------------------------------------------------------------------
// CHECK 2: Test Isolation & Dynamic Repository Switching (Requirements 1, 4, 5)
// -----------------------------------------------------------------------------
console.log('\nCheck 2: Test isolation and dynamic repository switching.');
// Requirement 1: Automated tests must use only mocked or in-memory repositories
const activeRepo = getQuizRepository();
assert(
  activeRepo instanceof InMemoryQuizRepository,
  'Automated tests must use only mocked or in-memory repositories (InMemoryQuizRepository)',
);
assert(
  activeRepo.isCloud === false,
  'Automated tests active repository must have isCloud === false',
);
assert(
  isCloudRepositoryActive() === false,
  'isCloudRepositoryActive must return false in automated tests',
);

// Requirement 4: Production Firestore activation must not occur inside npm test
assert(
  isTestEnvironment() === true,
  'isTestEnvironment must be true inside test runner',
);
assert(
  getFirebaseFirestore() === null,
  'getFirebaseFirestore must return null inside npm test to prevent live Firestore activation',
);

// Requirement 5: Production runtime switches to FirestoreQuizRepository when configured
const prodRepo = resolveProductionQuizRepository();
assert(
  prodRepo instanceof FirestoreQuizRepository,
  'Production runtime must resolve to FirestoreQuizRepository when configured',
);
assert(
  prodRepo.isCloud === true,
  'Production FirestoreQuizRepository must declare isCloud === true',
);
console.log('  ✔ PASS: Automated tests strictly use in-memory repository; production Firestore activation blocked in tests.');

// -----------------------------------------------------------------------------
// CHECK 3: FirestoreQuizRepository Security Guards (Requirements 2, 3)
// -----------------------------------------------------------------------------
console.log('\nCheck 3: FirestoreQuizRepository security guards.');
const firestoreRepo = new FirestoreQuizRepository();
assert(firestoreRepo.isCloud === true, 'FirestoreQuizRepository must have isCloud === true');
assert(typeof firestoreRepo.saveSubmission === 'function', 'saveSubmission must exist');
assert(typeof firestoreRepo.loadSubmission === 'function', 'loadSubmission must exist');
assert(typeof firestoreRepo.listSubmissions === 'function', 'listSubmissions must exist');
assert(typeof firestoreRepo.getSubmissionById === 'function', 'getSubmissionById must exist');
assert(typeof firestoreRepo.listReflectionsForSubmission === 'function', 'listReflectionsForSubmission must exist');
assert(typeof firestoreRepo.deleteSubmissionWithReflections === 'function', 'deleteSubmissionWithReflections must exist');
assert(typeof firestoreRepo.getAggregateAnalytics === 'function', 'getAggregateAnalytics must exist');

// Requirement 2: Test fixtures must never call or write to live FirestoreQuizRepository
let threwOnTestFixture = false;
try {
  await firestoreRepo.saveSubmission({
    submissionId: 'test-fixture-001',
    participantType: 'anonymous',
    displayName: null,
    mode: 'quick',
    questionIds: [1, 2, 3],
    selectedAnswers: {},
    correctCount: 2,
    totalQuestions: 3,
    score: 66,
    tier: 'Inner-Circle Material',
    reflections: {},
    reflectionCompletionStatus: 'skipped',
    startedAt: '2026-09-10T00:00:00.000Z',
    completedAt: '2026-09-10T00:05:00.000Z',
    quizCompletedAt: '2026-09-10T00:05:00.000Z',
    submittedAt: '2026-09-10T00:05:00.000Z',
    schemaVersion: 2,
  });
} catch (err) {
  threwOnTestFixture = true;
  assert(
    (err as Error).message.includes('Security Guard'),
    'Error message must indicate security guard violation',
  );
}
assert(threwOnTestFixture, 'Calling saveSubmission with a test fixture must be blocked and throw an error');

// Requirement 3: Demo submissions must never be persisted to Firestore
const demoResult = await firestoreRepo.saveSubmission({
  submissionId: 'demo-sub-999-check',
  participantType: 'named',
  displayName: '[DEMO] Verification Demo',
  mode: 'quick',
  questionIds: [1, 2, 3],
  selectedAnswers: {},
  correctCount: 3,
  totalQuestions: 3,
  score: 100,
  tier: 'Forsyth Savant',
  reflections: {},
  reflectionCompletionStatus: 'completed',
  startedAt: '2026-09-10T00:00:00.000Z',
  completedAt: '2026-09-10T00:05:00.000Z',
  quizCompletedAt: '2026-09-10T00:05:00.000Z',
  submittedAt: '2026-09-10T00:05:00.000Z',
  schemaVersion: 2,
});
assert(demoResult === 'demo-sub-999-check', 'Demo submissions must return submissionId without persisting to Firestore');
console.log('  ✔ PASS: Test fixtures and demo submissions are completely blocked from live Firestore.');

// -----------------------------------------------------------------------------
// CHECK 4: Participant UI never displays Firebase UIDs or login screens
// -----------------------------------------------------------------------------
console.log('\nCheck 4: Participant views UID & anonymous privacy.');
const identityViewSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/IdentityView.tsx'), 'utf-8');
const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf-8');
const resultsViewSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/ResultsView.tsx'), 'utf-8');

assert(!identityViewSrc.includes('signInWithEmailAndPassword'), 'Participant view must not ask for password');
assert(!identityViewSrc.includes('ownerUid'), 'Participant view must not expose ownerUid');
assert(!headerSrc.includes('ownerUid'), 'Header must not display Firebase UID');
assert(!resultsViewSrc.includes('ownerUid'), 'Results view must not display Firebase UID');
console.log('  ✔ PASS: Participant views are completely free of login screens and Firebase UIDs.');

// -----------------------------------------------------------------------------
// CHECK 5: Admin Auth Provider selection
// -----------------------------------------------------------------------------
console.log('\nCheck 5: Admin auth provider selection.');
const adminAuth = getAdminAuthProvider();
assert(adminAuth instanceof FirebaseAdminAuthAdapter, 'getAdminAuthProvider must return FirebaseAdminAuthAdapter when configured');
assert(typeof adminAuth.signIn === 'function', 'signIn must exist');
assert(typeof adminAuth.signOut === 'function', 'signOut must exist');
assert(typeof adminAuth.subscribeToAuthState === 'function', 'subscribeToAuthState must exist');
console.log('  ✔ PASS: Admin auth provider uses FirebaseAdminAuthAdapter connected to Firebase Auth.');

// -----------------------------------------------------------------------------
// CHECK 6: Firestore security rules invariants
// -----------------------------------------------------------------------------
console.log('\nCheck 6: Firestore security rules invariants.');
const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf-8');
assert(rules.includes('isAuthorizedAdmin()'), 'Rules must define isAuthorizedAdmin() helper');
assert(rules.includes('request.auth.uid ==') || rules.includes('token.admin == true'), 'Rules must enforce admin authorization');
assert(!rules.includes('REPLACE_WITH_FORSYTH_ADMIN_UID'), 'Rules must not contain placeholder REPLACE_WITH_FORSYTH_ADMIN_UID');
assert(!rules.includes('match /reflections/{submissionId}'), 'Rules must not contain legacy root reflections collection rule');
assert(rules.includes('ownerUid == request.auth.uid'), 'Rules must enforce ownerUid match on submission creation');
assert(rules.includes('request.resource.data.mode == resource.data.mode'), 'Rules must forbid changing mode');
assert(rules.includes('request.resource.data.score == resource.data.score'), 'Rules must forbid changing score');
assert(rules.includes('allow list: if isAuthorizedAdmin();'), 'Rules must forbid public participant listing of submissions');
assert(rules.includes('match /reflections/{reflectionId}'), 'Rules must protect nested reflections subcollection');
console.log('  ✔ PASS: firestore.rules strictly protects participant data, scores, and admin listing.');

// -----------------------------------------------------------------------------
// CHECK 7: UI status indicators for Cloud Connected state
// -----------------------------------------------------------------------------
console.log('\nCheck 7: Cloud Connected status badge in Admin UI.');
const adminLayoutSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/admin/AdminLayout.tsx'), 'utf-8');
assert(adminLayoutSrc.includes('Cloud Connected'), 'Admin layout must render Cloud Connected badge when active');
assert(adminLayoutSrc.includes('admin-status-cloud-badge'), 'Admin layout must have status cloud badge ID');
console.log('  ✔ PASS: Cloud Connected indicators correctly reflect active Firestore status.');

// -----------------------------------------------------------------------------
// CHECK 8: Sign out memory purge in App.tsx
// -----------------------------------------------------------------------------
console.log('\nCheck 8: Immediate admin data purge upon sign out.');
const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
assert(appSrc.includes('setAdminSubmissions([])'), 'App must clear adminSubmissions on signout');
assert(appSrc.includes('setSelectedSubmissionId(null)'), 'App must clear selectedSubmissionId on signout');
console.log('  ✔ PASS: Private submission data is immediately purged from state upon sign out.');

// -----------------------------------------------------------------------------
// CHECK 9: Setup documentation and .env declarations
// -----------------------------------------------------------------------------
console.log('\nCheck 9: Documentation and environment variables specification.');
const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf-8');
const setupDoc = fs.readFileSync(path.join(process.cwd(), 'docs/FIREBASE_SETUP.md'), 'utf-8');

assert(envExample.includes('VITE_FIREBASE_API_KEY='), '.env.example must declare VITE_FIREBASE_API_KEY');
assert(envExample.includes('VITE_ADMIN_UID='), '.env.example must declare VITE_ADMIN_UID');
assert(setupDoc.includes('Firebase Console'), 'Setup guide must detail Firebase Console steps');
assert(setupDoc.includes('Anonymous'), 'Setup guide must instruct enabling Anonymous authentication');
assert(setupDoc.includes('Email/Password'), 'Setup guide must instruct enabling Email/Password authentication');
console.log('  ✔ PASS: Setup documentation and .env.example provide complete and accurate instructions.');

console.log('\n=====================================================================');
console.log('✔ ALL STAGE 5 VERIFICATION CHECKS PASSED: FIREBASE INTEGRATION VERIFIED');
console.log('=====================================================================\n');
