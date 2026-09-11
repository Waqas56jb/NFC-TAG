import { useState } from 'react'
import { GroupBoard } from '../components/GroupBoard'
import { StaffDmModal } from '../components/StaffDmModal'
import { useApp } from '../context/AppContext'

export function Groups() {
  const {
    store,
    user,
    groups,
    loadMessages,
    createGroup,
    updateGroupPhoto,
    postGroupMessage,
    deleteGroupMessage,
    openDmThread,
    loadDmMessages,
    postDmMessage,
  } = useApp()
  const [messaging, setMessaging] = useState(null)

  return (
    <>
      <GroupBoard
        groups={groups}
        grades={store.grades || []}
        students={store.students || []}
        user={user}
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
        user={user}
        onClose={() => setMessaging(null)}
        openThread={openDmThread}
        loadMessages={loadDmMessages}
        onPost={postDmMessage}
      />
    </>
  )
}
