/**
 * Escapes regex special characters to prevent ReDoS or invalid regex crashes in MongoDB queries.
 * Handles dangerous characters: . * + ? ^ $ { } ( ) | [ ] \
 */
export function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { escapeRegex };
