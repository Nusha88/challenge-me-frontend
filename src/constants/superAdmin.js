export const SUPER_ADMIN_USER_ID = '69484c7fa2adbb4a712a9ea3'

export function isSuperAdminUserId(userId) {
  if (userId == null) return false
  return String(userId) === SUPER_ADMIN_USER_ID
}
