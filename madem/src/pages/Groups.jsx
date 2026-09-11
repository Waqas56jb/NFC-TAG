import { GroupBoard } from '../components/GroupBoard'
import { useApp } from '../context/AppContext'

export function Groups() {
  const { store, user, groups, loadMessages, createGroup, updateGroupPhoto, postGroupMessage, deleteGroupMessage } = useApp()
  return (
    <GroupBoard
      groups={groups}
      grades={store.grades || []}
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
    />
  )
}
