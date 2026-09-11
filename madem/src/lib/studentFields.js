export const emptyStudent = {
  name: '',
  age: '',
  gender: '',
  dob: '',
  nic: '',
  rollNo: '',
  bloodGroup: '',
  allergies: '',
  address: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  emergencyPhone: '',
  notes: '',
  photo: '',
}

export function studentFromRecord(student) {
  return {
    ...emptyStudent,
    name: student.name || '',
    age: student.age || '',
    gender: student.gender || '',
    dob: student.dob || '',
    nic: student.nic || '',
    rollNo: student.rollNo || '',
    bloodGroup: student.bloodGroup || '',
    allergies: student.allergies || '',
    address: student.address || '',
    parentName: student.parentName || '',
    parentPhone: student.parentPhone || '',
    parentEmail: student.parentEmail || '',
    emergencyPhone: student.emergencyPhone || '',
    notes: student.notes || '',
    photo: student.photo || '',
  }
}
