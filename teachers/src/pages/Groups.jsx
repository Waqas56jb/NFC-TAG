import { useCallback, useEffect, useState } from 'react'
import { GroupBoard } from '../components/GroupBoard'
import { StaffChatDesk } from '../components/StaffChatDesk'
import { useTeacher } from '../context/TeacherContext'
import { useI18n } from '../i18n/I18nContext'
import { hub } from '../lib/supabase'

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
  const { t } = useI18n()
  const [tab, setTab] = useState('groups')
  const [threads, setThreads] = useState([])

  const refreshThreads = useCallback(async () => {
    if (!teacher?.id) return
    const result = await hub.listDmThreadsForStaff(teacher.id, 'teacher')
    if (result.ok) setThreads(result.threads)
  }, [teacher?.id])

  useEffect(() => {
    if (tab === 'dm') refreshThreads()
  }, [tab, refreshThreads])

  return (
    <section className="groups-page">
      <div className="groups-switch">
        <button type="button" className={tab === 'groups' ? 'on' : ''} onClick={() => setTab('groups')}>
          {t('tabClassGroups')}
        </button>
        <button type="button" className={tab === 'dm' ? 'on' : ''} onClick={() => setTab('dm')}>
          {t('tabDirectChat')}
          {threads.length ? <i className="tab-count">{threads.length}</i> : null}
        </button>
      </div>

      {tab === 'groups' ? (
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
      ) : (
        <StaffChatDesk
          user={{ ...teacher, role: 'teacher' }}
          grades={school.grades || []}
          students={school.students || []}
          allowedCards={classes}
          threads={threads}
          openThread={openDmThread}
          loadMessages={loadDmMessages}
          onPost={postDmMessage}
          onThreadsRefresh={refreshThreads}
        />
      )}
    </section>
  )
}
