export function genderLabel(value, t) {
  if (value === 'Boy') return t('boy')
  if (value === 'Girl') return t('girl')
  if (value === 'Other') return t('other')
  return value || ''
}

export const ERROR_KEYS = {
  'Email or password is incorrect.': 'errBadLogin',
  'Could not load school data.': 'errBoot',
  'Could not reach the school database. Refresh and try again.': 'errReachRetry',
  'Could not reach the school database.': 'errReach',
  'Request failed.': 'errRequest',
  'Not signed in.': 'errSignIn',
  'Student not found.': 'errStudentMissing',
}
