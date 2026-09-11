import { GroupBoard } from '../components/GroupBoard'
import { useTeacher } from '../context/TeacherContext'

export function Groups() {
  const { school, teacher, classes, groups, loadMessages, createGroup, updateGroupPhoto, postGroupMessage, deleteGroupMessage } = useTeacher()
  return (
    <GroupBoard
      groups={groups}
      grades={school.grades || []}
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
    />
  )
}
