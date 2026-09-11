export const ERROR_KEYS = {
  'Email or password is incorrect.': 'errBadLogin',
  'This sub-user is blocked. Ask Madam to restore access.': 'errSubBlocked',
  'This teacher login is blocked. Ask Madam to restore it.': 'errTeacherBlocked',
  'This email is already in use.': 'errEmailTaken',
  'This class already exists.': 'errClassExists',
  'Student name is required.': 'errStudentName',
  'Already assigned.': 'errAlreadyAssigned',
  'Select a date first.': 'errSelectDate',
  'Could not load school data.': 'errBoot',
  'Could not reach the school database. Refresh and try again.': 'errReachRetry',
  'Could not reach the school database.': 'errReach',
  'Please choose an image file.': 'errImageType',
  'Photo must be under 5MB.': 'errPhotoSize',
  'Could not read that photo.': 'errPhotoRead',
  'Current password is incorrect.': 'errBadPassword',
  'Only Madam can edit this account.': 'errOnlyMadam',
  'Sign in first.': 'errSignIn',
  'Student not found.': 'errStudentMissing',
  'Teacher not found.': 'errTeacherMissing',
  'Request failed.': 'errRequest',
  'Not signed in.': 'errSignIn',
  'Invalid leave decision.': 'errLeaveDecision',
  'Leave request not found.': 'errLeaveMissing',
}

export function genderLabel(value, t) {
  if (value === 'Boy') return t('boy')
  if (value === 'Girl') return t('girl')
  if (value === 'Other') return t('other')
  return value || ''
}

export function formatActivity(item, t) {
  const action = t(`act_${item.action}`)
  const target = t(`target_${String(item.targetType || '').replaceAll('-', '_')}`)
  return {
    line: t('activityLine', { action, target, name: item.targetName }),
    detail: formatDetail(item.detail, t),
  }
}

function formatDetail(detail, t) {
  const d = String(detail || '')
  const teacherLogin = d.match(/^Created teacher login (.+)$/)
  if (teacherLogin) return t('detailCreatedTeacher', { email: teacherLogin[1] })
  const subLogin = d.match(/^Created sub-user login (.+)$/)
  if (subLogin) return t('detailCreatedSub', { email: subLogin[1] })
  if (d === 'Deleted teacher credentials') return t('detailDeletedTeacher')
  if (d === 'Deleted sub-user credentials') return t('detailDeletedSub')
  if (d === 'Updated Madam account details') return t('detailUpdatedMadam')
  if (d === 'Deleted class card') return t('detailDeletedClass')
  if (d === 'Updated student details') return t('detailUpdatedStudent')
  if (d === 'Deleted student record') return t('detailDeletedStudent')
  if (d === 'blocked teacher') return t('detailBlockedTeacher')
  if (d === 'active teacher') return t('detailRestoredTeacher')
  if (d === 'blocked sub-user') return t('detailBlockedSub')
  if (d === 'active sub-user') return t('detailRestoredSub')
  const createdClass = d.match(/^Created class (.+)$/)
  if (createdClass) return t('detailCreatedClass', { name: createdClass[1] })
  const addedStudent = d.match(/^Added student to (.+)$/)
  if (addedStudent) return t('detailAddedStudent', { name: addedStudent[1] })
  const assigned = d.match(/^Assigned to (.+)$/)
  if (assigned) return t('detailAssignedTo', { name: assigned[1] })
  const removed = d.match(/^Removed from (.+)$/)
  if (removed) return t('detailRemovedFrom', { name: removed[1] })
  const hid = d.match(/^Hid class for (.+)$/)
  if (hid) return t('detailHidFor', { name: hid[1] })
  const showed = d.match(/^Showed class for (.+)$/)
  if (showed) return t('detailShowedFor', { name: showed[1] })
  return d
}
