import { HONEST_ROOM_QUESTIONS } from '../data/honestQuestions';
import { QuizSubmission } from '../types';

/**
 * Sanitizes a single cell value to protect against CSV / Formula Injection
 * (also known as Spreadsheet Formula Injection or CWE-1236).
 *
 * If the value begins with dangerous characters (=, +, -, @, \t, \r),
 * it is prefixed with a single quotation mark (') to force spreadsheet software
 * (Microsoft Excel, Google Sheets, Calc) to interpret the value strictly as plain text.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue = String(value);

  // Check for formula injection triggers at the beginning of the string
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.some((char) => stringValue.startsWith(char))) {
    stringValue = `'${stringValue}`;
  }

  // Escape quotation marks by doubling them (" -> "")
  const escapedValue = stringValue.replace(/"/g, '""');

  // Wrap every field in double quotes to handle commas, newlines, and special characters
  return `"${escapedValue}"`;
}

/**
 * Generates CSV string for quiz submissions.
 * Excludes private Honest Room reflection free-form text.
 */
export function generateSubmissionsCsv(submissions: QuizSubmission[]): string {
  const headers = [
    'Submission ID',
    'Participant Type',
    'Display Name',
    'Quiz Mode',
    'Correct Count',
    'Total Questions',
    'Percentage Score',
    'Result Tier',
    'Honest Room Status',
    'Quiz Completed Timestamp',
    'Submitted Timestamp',
  ];

  const rows = submissions.map((sub) => [
    sanitizeCsvCell(sub.submissionId),
    sanitizeCsvCell(sub.participantType),
    sanitizeCsvCell(sub.participantType === 'anonymous' ? 'Anonymous' : sub.displayName || 'Unnamed'),
    sanitizeCsvCell(sub.mode === 'quick' ? 'Quick Play' : 'Full Challenge'),
    sanitizeCsvCell(sub.correctCount),
    sanitizeCsvCell(sub.totalQuestions),
    sanitizeCsvCell(`${sub.score}%`),
    sanitizeCsvCell(sub.tier),
    sanitizeCsvCell(sub.reflectionCompletionStatus),
    sanitizeCsvCell(sub.quizCompletedAt),
    sanitizeCsvCell(sub.submittedAt),
  ]);

  const csvContent = [headers.map((h) => sanitizeCsvCell(h)).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Prefix with UTF-8 BOM (\uFEFF) to ensure spreadsheet software decodes UTF-8 correctly
  return `\uFEFF${csvContent}`;
}

/**
 * Generates separate CSV string for private Honest Room reflections.
 * Includes only submissions that have reflections.
 */
export function generateReflectionsCsv(submissions: QuizSubmission[]): string {
  const headers = [
    'Submission ID',
    'Participant Label',
    'Participant Type',
    'Reflection Question ID',
    'Prompt Category',
    'Prompt Text',
    'Participant Response',
    'Submitted Timestamp',
  ];

  const promptMap = new Map(HONEST_ROOM_QUESTIONS.map((q) => [q.id, q]));
  const rows: string[][] = [];

  submissions.forEach((sub) => {
    const participantLabel =
      sub.participantType === 'anonymous' ? 'Anonymous' : sub.displayName || 'Unnamed';
    const reflections = sub.reflections || {};

    HONEST_ROOM_QUESTIONS.forEach((q) => {
      const response = reflections[q.id];
      const hasResponse = typeof response === 'string' && response.trim().length > 0;

      rows.push([
        sanitizeCsvCell(sub.submissionId),
        sanitizeCsvCell(participantLabel),
        sanitizeCsvCell(sub.participantType),
        sanitizeCsvCell(q.id),
        sanitizeCsvCell(q.category),
        sanitizeCsvCell(q.prompt),
        sanitizeCsvCell(hasResponse ? response : '(Skipped / Unanswered)'),
        sanitizeCsvCell(sub.submittedAt),
      ]);
    });
  });

  const csvContent = [
    headers.map((h) => sanitizeCsvCell(h)).join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  return `\uFEFF${csvContent}`;
}

/**
 * Triggers a secure browser file download for CSV content.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
