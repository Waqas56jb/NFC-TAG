import { GroupBoard } from '../components/GroupBoard'
import { useStudent } from '../context/StudentContext'

export function Groups() {
  const { student, grades, groups, allowedCards, loadMessages, postGroupMessage } = useStudent()
  return (
    <GroupBoard
      groups={groups}
      grades={grades}
      allowedCards={allowedCards}
      user={student}
      canCreate={false}
      canDelete={false}
      canPost
      loadMessages={loadMessages}
      onPost={postGroupMessage}
    />
  )
}
