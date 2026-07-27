/**
 * Quest panel helpers for ChallengeDetailsDialog (success modal payload scaffolding).
 */
export { createEmptyTriumphSharePayload as createEmptyQuestShareCardData } from '../utils/triumphSharePayload'

export function createPendingQuestAction() {
  return { index: null, id: null, text: '' }
}
