import { isFirebaseConfigured, isTestEnvironment } from '../firebase';
import { FirestoreQuizRepository } from './firestoreQuizRepository';
import { InMemoryQuizRepository } from './inMemoryQuizRepository';
import { LocalStorageQuizRepository } from './localStorageQuizRepository';
import { QuizRepository } from './quizRepository';

let repositoryInstance: QuizRepository | null = null;
let testRepositoryInstance: QuizRepository | null = null;

/**
 * Returns the active quiz repository.
 *
 * Requirements:
 * 1. Automated tests must use only mocked or in-memory repositories.
 * 2. Test fixtures must never call the live FirestoreQuizRepository.
 * 4. Production Firestore activation must not occur inside npm test.
 * 5. In production/browser, real participants use FirestoreQuizRepository when configured.
 */
export function getQuizRepository(): QuizRepository {
  // Enforce mocked/in-memory repository for all automated test runs
  if (isTestEnvironment()) {
    if (!testRepositoryInstance) {
      testRepositoryInstance = new InMemoryQuizRepository();
    }
    return testRepositoryInstance;
  }

  if (!repositoryInstance) {
    if (isFirebaseConfigured()) {
      repositoryInstance = new FirestoreQuizRepository();
    } else {
      repositoryInstance = new LocalStorageQuizRepository();
    }
  }
  return repositoryInstance;
}

/**
 * Determines whether cloud repository is actively handling live submissions.
 * Always returns false in test environments.
 */
export function isCloudRepositoryActive(): boolean {
  if (isTestEnvironment()) {
    return false;
  }
  return isFirebaseConfigured();
}

/**
 * Helper to inspect or create the repository configuration that would run in production,
 * allowing tests to verify switching logic without executing network requests.
 */
export function resolveProductionQuizRepository(): QuizRepository {
  if (isFirebaseConfigured()) {
    return new FirestoreQuizRepository();
  }
  return new LocalStorageQuizRepository();
}

/**
 * Allows explicit repository injection for tests or mocked fixtures.
 */
export function setQuizRepository(repo: QuizRepository | null): void {
  if (isTestEnvironment()) {
    testRepositoryInstance = repo;
  } else {
    repositoryInstance = repo;
  }
}

export function resetQuizRepository(): void {
  repositoryInstance = null;
  testRepositoryInstance = null;
}

// Dynamic singleton delegating directly to active repository
export const defaultQuizRepository: QuizRepository = new Proxy({} as QuizRepository, {
  get(_target, prop) {
    const active = getQuizRepository();
    const val = (active as any)[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  },
});

export * from './quizRepository';
export * from './localStorageQuizRepository';
export * from './firestoreQuizRepository';
export * from './inMemoryQuizRepository';
