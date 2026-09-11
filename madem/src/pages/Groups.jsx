import { useCallback, useEffect, useState } from 'react'
import { GroupBoard } from '../components/GroupBoard'
import { StaffChatDesk } from '../components/StaffChatDesk'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { hub } from '../lib/supabase'

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
  const { t } = useI18n()
  const [tab, setTab] = useState('groups')
  const [threads, setThreads] = useState([])

  const staffRole = user?.role === 'sub' ? 'sub' : 'madam'

  const refreshThreads = useCallback(async () => {
    if (!user?.id) return
    const result = await hub.listDmThreadsForStaff(user.id, staffRole)
    if (result.ok) setThreads(result.threads)
  }, [user?.id, staffRole])

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
      ) : (
        <StaffChatDesk
          user={user}
          grades={store.grades || []}
          students={store.students || []}
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
