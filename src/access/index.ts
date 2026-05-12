import type { Access } from 'payload'

type UserLike = {
  id?: number | string
  role?: 'admin' | 'user'
} | null

const isAdmin = (user: UserLike): boolean => user?.role === 'admin'

export const checkAdmin = ({ req: { user } }: any): boolean => {
  console.log('--- DEBUG checkAdmin ---')
  console.log('User:', user?.email)
  console.log('Role:', user?.role)
  const isAdmin = user?.role === 'admin'
  console.log('Result:', isAdmin)
  return isAdmin
}

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user as UserLike)

export const ownerOrAdmin = (ownerField = 'user'): Access => {
  return ({ req: { user } }) => {
    const currentUser = user as UserLike

    if (!currentUser) return false
    if (isAdmin(currentUser)) return true

    return {
      [ownerField]: {
        equals: currentUser.id,
      },
    } as any
  }
}

export const activeOrAdmin = (activeField = 'isActive'): Access => {
  return ({ req: { user } }) => {
    const currentUser = user as UserLike

    if (isAdmin(currentUser)) return true

    return {
      [activeField]: {
        equals: true,
      },
    } as any
  }
}

export const statusOrAdmin = (statusField: string, publicStatus: string): Access => {
  return ({ req: { user } }) => {
    const currentUser = user as UserLike

    if (isAdmin(currentUser)) return true

    return {
      [statusField]: {
        equals: publicStatus,
      },
    } as any
  }
}

export const statusOrOwnerOrAdmin = (statusField: string, publicStatus: string, ownerField = 'user'): Access => {
  return ({ req: { user } }) => {
    const currentUser = user as UserLike

    if (!currentUser) {
      return {
        [statusField]: {
          equals: publicStatus,
        },
      } as any
    }

    if (isAdmin(currentUser)) return true

    return {
      or: [
        {
          [statusField]: {
            equals: publicStatus,
          },
        },
        {
          [ownerField]: {
            equals: currentUser.id,
          },
        },
      ],
    } as any
  }
}

export const selfOrAdminByID = ({ req: { user }, doc }: any): boolean => {
  const currentUser = user as UserLike

  if (!currentUser) return false
  if (isAdmin(currentUser)) return true

  return String(doc?.id) === String(currentUser.id)
}

export const adminOnlyField = ({ req: { user } }: any): boolean => isAdmin(user as UserLike)
