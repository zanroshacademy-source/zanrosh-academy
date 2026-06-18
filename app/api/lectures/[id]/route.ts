import { apiError } from '@/lib/utils'

// Lectures no longer exist as a separate entity.
// Video content is now managed directly on Chapters.
// These routes are kept to avoid 404 build errors.

export async function PATCH() {
  return apiError('Lectures are deprecated. Edit the Chapter directly.', 410)
}

export async function DELETE() {
  return apiError('Lectures are deprecated. Delete the Chapter directly.', 410)
}

