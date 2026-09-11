export const ERROR_KEYS = {
  'Email or password is incorrect.': 'errBadLogin',
  'This teacher login is blocked. Ask Madam to restore it.': 'errTeacherBlocked',
  'Could not load school data.': 'errBoot',
  'Could not reach the school database. Refresh and try again.': 'errReachRetry',
  'Could not reach the school database.': 'errReach',
  'Select a date first.': 'errSelectDate',
  'Request failed.': 'errRequest',
  'Not signed in.': 'errSignIn',
  'This class is not assigned to you.': 'errNotAssigned',
  'Already checked in today.': 'errCheckedIn',
  'Check in first.': 'errCheckInFirst',
  'Already checked out today.': 'errCheckedOut',
  'Select leave dates.': 'errLeaveDates',
  'End date must be after start date.': 'errLeaveOrder',
}

export function genderLabel(value, t) {
  if (value === 'Boy') return t('boy')
  if (value === 'Girl') return t('girl')
  if (value === 'Other') return t('other')
  return value || ''
}
