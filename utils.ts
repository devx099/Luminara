import type { Task } from './types';

/**
 * Calculates a similarity score between two strings based on common words.
 * A more robust implementation could use libraries like 'string-similarity'.
 * This is a simplified version for this context.
 */
function getSimilarity(s1: string, s2: string): number {
  const words1 = new Set(s1.toLowerCase().split(/\s+/));
  const words2 = new Set(s2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Finds the best task match from a list of tasks based on a given title.
 * It prioritizes tasks that are still pending.
 */
export function findBestTaskMatch(titleFromChat: string, tasks: Task[]): Task | null {
  if (!titleFromChat || tasks.length === 0) {
    return null;
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (pendingTasks.length === 0) {
    return null; // No pending tasks to match against
  }

  let bestMatch: Task | null = null;
  let highestScore = 0.5; // Require a minimum similarity score to avoid wrong matches

  for (const task of pendingTasks) {
    const score = getSimilarity(titleFromChat, task.title);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = task;
    }
  }

  return bestMatch;
}