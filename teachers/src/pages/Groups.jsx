import { useState } from 'react'
import { GroupBoard } from '../components/GroupBoard'
import { StaffDmModal } from '../components/StaffDmModal'
import { useTeacher } from '../context/TeacherContext'

export function Groups() {
  const {
    school,
    teacher,
    classes,
    groups,
    loadMessages,
    createGroup,
    updateGroupPhoto,
    postGroupMessage,
    deleteGroupMessage,
    openDmThread,
    loadDmMessages,
    postDmMessage,
  } = useTeacher()
  const [messaging, setMessaging] = useState(null)

  return (
    <>
      <GroupBoard
        groups={groups}
        grades={school.grades || []}
        students={school.students || []}
        allowedCards={classes}
        user={teacher}
        canCreate
        canDelete
        canPost
        canEditPhoto
        loadMessages={loadMessages}
        onCreate={createGroup}
        onUpdatePhoto={updateGroupPhoto}
        onPost={postGroupMessage}
        onDelete={deleteGroupMessage}
        onMessageStudent={setMessaging}
      />
      <StaffDmModal
        open={Boolean(messaging)}
        student={messaging}
        user={teacher}
        onClose={() => setMessaging(null)}
        openThread={openDmThread}
        loadMessages={loadDmMessages}
        onPost={postDmMessage}
      />
    </>
  )
}
