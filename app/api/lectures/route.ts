import { apiError } from '@/lib/utils'

// Lectures no longer exist as a separate entity.
// Video content is now managed directly on Chapters via /api/chapters/[id].
export async function POST() {
  return apiError('Lectures are deprecated. Add video content to a Chapter directly.', 410)
}

