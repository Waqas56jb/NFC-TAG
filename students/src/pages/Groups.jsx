import { useEffect, useState } from 'react'
import { DmInbox } from '../components/DmInbox'
import { GroupBoard } from '../components/GroupBoard'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'

export function Groups() {
  const { student, grades, groups, allowedCards, dmThreads, loadMessages, postGroupMessage, loadDmMessages, postDmMessage, refreshDmThreads } =
    useStudent()
  const { t } = useI18n()
  const [mode, setMode] = useState('groups')

  useEffect(() => {
    if (mode === 'chats') refreshDmThreads?.()
  }, [mode])

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
          {dmThreads?.length ? <i>{dmThreads.length > 9 ? '9+' : dmThreads.length}</i> : null}
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
          canPost
          loadMessages={loadMessages}
          onPost={postGroupMessage}
        />
      ) : (
        <DmInbox
          user={student}
          threads={dmThreads || []}
          loadMessages={loadDmMessages}
          onPost={postDmMessage}
          peerLabel={(thread) => thread.staffName || thread.staffRole}
        />
      )}
    </section>
  )
}
