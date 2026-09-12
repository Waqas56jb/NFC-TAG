import { useEffect, useMemo, useState } from 'react'
import { DmInbox } from '../components/DmInbox'
import { GroupBoard } from '../components/GroupBoard'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'
import { cleanPersonName, roleLabel } from '../lib/roles'

export function Groups() {
  const {
    student,
    grades,
    groups,
    allowedCards,
    dmThreads,
    classTeachers,
    loadMessages,
    postGroupMessage,
    loadDmMessages,
    postDmMessage,
    refreshDmThreads,
    startTeacherChat,
  } = useStudent()
  const { t } = useI18n()
  const [mode, setMode] = useState('groups')
  const [startingId, setStartingId] = useState('')

  const teacherThreads = useMemo(
    () => (dmThreads || []).filter((thread) => thread.staffRole === 'teacher'),
    [dmThreads],
  )
  const openStaffIds = useMemo(() => new Set(teacherThreads.map((thread) => thread.staffId)), [teacherThreads])
  const availableTeachers = useMemo(
    () => (classTeachers || []).filter((person) => !openStaffIds.has(person.id)),
    [classTeachers, openStaffIds],
  )

  useEffect(() => {
    if (mode === 'chats') refreshDmThreads?.()
  }, [mode])

  async function beginChat(person) {
    if (startingId) return
    setStartingId(person.id)
    try {
      await startTeacherChat?.(person)
    } finally {
      setStartingId('')
    }
  }

  return (
    <section className="groups-page">
      <div className="groups-switch" role="tablist" aria-label={t('navGroups')}>
        <button type="button" role="tab" aria-selected={mode === 'groups'} className={mode === 'groups' ? 'on' : ''} onClick={() => setMode('groups')}>
          <span className="gs-ico groups" aria-hidden="true" />
          {t('tabGroup')}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'chats'} className={mode === 'chats' ? 'on' : ''} onClick={() => setMode('chats')}>
          <span className="gs-ico chat" aria-hidden="true" />
          {t('tabChat')}
          {teacherThreads.length ? <i>{teacherThreads.length > 9 ? '9+' : teacherThreads.length}</i> : null}
        </button>
      </div>

      {mode === 'groups' ? (
        <GroupBoard
          groups={groups}
          grades={grades}
          allowedCards={allowedCards}
          user={student}
          canCreate={false}
          canDelete={false}
          canPost={false}
          loadMessages={loadMessages}
          onPost={postGroupMessage}
        />
      ) : (
        <>
          {availableTeachers.length > 0 ? (
            <div className="teacher-chat-start">
              <p className="muted">{t('chatTeachersHint')}</p>
              <div className="teacher-chat-list">
                {availableTeachers.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="ghost"
                    disabled={Boolean(startingId)}
                    onClick={() => beginChat(person)}
                  >
                    {startingId === person.id ? t('working') : t('chatWithTeacher', { name: person.name })}
                    {person.subject ? <small> · {person.subject}</small> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <DmInbox
            user={student}
            threads={teacherThreads}
            loadMessages={loadDmMessages}
            onPost={postDmMessage}
            canPost
            peerLabel={(thread) =>
              cleanPersonName(thread.staffName, thread.staffRole) || roleLabel(thread.staffRole)
            }
          />
        </>
      )}
    </section>
  )
}
