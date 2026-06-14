/**
 * Utility function to parse ID from request params
 * Handles both string and number IDs
 */
export function parseId(id: string | undefined): number {
  if (!id) {
    throw new Error('ID is required');
  }
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ID: ${id}`);
  }
  return parsed;
}

