import { auth, currentUser } from '@clerk/nextjs/server'

export async function getServerAuth(): Promise<{ userId: string | null }> {
  const { userId } = await auth()
  return { userId }
}

export async function getServerUser() {
  return currentUser()
}
