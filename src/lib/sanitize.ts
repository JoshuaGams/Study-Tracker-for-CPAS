/**
 * Enterprise input sanitization and defensive validation utilities
 */

/**
 * Strips HTML tags, script vectors, and excessive whitespace from user inputs.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  
  // Strip control characters and script/html tags
  const clean = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS pseudo-protocol
    .replace(/data:/gi, '') // Remove data pseudo-protocol
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove ASCII control characters
    .trim();

  return clean.slice(0, maxLength);
}

/**
 * Safely parses and clamps numeric values with defaults
 */
export function sanitizeNumber(
  input: unknown,
  fallback = 0,
  min = -Infinity,
  max = Infinity
): number {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
    return Math.min(Math.max(input, min), max);
  }
  if (typeof input === 'string') {
    const parsed = parseFloat(input.trim());
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.min(Math.max(parsed, min), max);
    }
  }
  return fallback;
}

/**
 * Validates URLs and prevents javascript: execution
 */
export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Prevent dangerous protocols
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return '';
  }

  // Prepend https:// if not present and looks like a domain
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Validates that an imported payload matches the required application state structure
 */
export function validateImportedBackup(json: unknown): { isValid: boolean; error?: string } {
  if (!json || typeof json !== 'object') {
    return { isValid: false, error: 'Imported file is not a valid JSON object.' };
  }

  const obj = (json as Record<string, any>).data || json;

  if (!Array.isArray(obj.mainTopics)) {
    return { isValid: false, error: 'Missing or invalid "mainTopics" collection in backup payload.' };
  }

  if (!Array.isArray(obj.subtopics)) {
    return { isValid: false, error: 'Missing or invalid "subtopics" collection in backup payload.' };
  }

  // Verify elements have IDs and titles
  for (const topic of obj.mainTopics) {
    if (!topic || typeof topic.id !== 'string' || typeof topic.title !== 'string') {
      return { isValid: false, error: 'Main topic structure is corrupted or missing required ID/Title.' };
    }
  }

  for (const sub of obj.subtopics) {
    if (!sub || typeof sub.id !== 'string' || typeof sub.mainTopicId !== 'string') {
      return { isValid: false, error: 'Subtopic structure is corrupted or missing reference IDs.' };
    }
  }

  return { isValid: true };
}
