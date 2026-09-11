import { useEffect, useMemo, useState } from 'react'
import { displayPhoto } from '../lib/avatar'
import { readShareFile } from '../lib/fileShare'
import { listClassCards } from '../lib/school'
import { useI18n } from '../i18n/I18nContext'
import { ChatIconButton } from './ChatIconButton'

function Attachment({ item, t }) {
  if (item.fileType?.startsWith('image/')) {
    return <img className="wa-media" src={item.fileData} alt={item.fileName} />
  }
  if (item.fileType?.startsWith('video/')) {
    return <video className="wa-media" src={item.fileData} controls />
  }
  return (
    <a className="wa-file" href={item.fileData} download={item.fileName} target="_blank" rel="noreferrer">
      {t('download')} · {item.fileName || t('file')}
    </a>
  )
}

/**
 * Staff DM desk: sections → students → chat, plus chat history.
 */
export function StaffChatDesk({
  user,
  grades = [],
  students = [],
  allowedCards = null,
  threads = [],
  openThread,
  loadMessages,
  onPost,
  onThreadsRefresh,
}) {
  const { t, lang, tx } = useI18n()
  const cards = allowedCards || listClassCards(grades)
  const [mode, setMode] = useState('browse') // browse | history
  const [sectionKey, setSectionKey] = useState(cards[0] ? `${cards[0].gradeId}:${cards[0].sectionId}` : '')
  const [student, setStudent] = useState(null)
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mobilePane, setMobilePane] = useState('sections') // sections | students | room

  const activeCard = cards.find((c) => `${c.gradeId}:${c.sectionId}` === sectionKey) || cards[0]

  const sectionStudents = useMemo(() => {
    if (!activeCard) return []
    return (students || [])
      .filter((s) => s.gradeId === activeCard.gradeId && s.sectionId === activeCard.sectionId)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [students, activeCard])

  useEffect(() => {
    if (!cards.length) return
    if (!cards.some((c) => `${c.gradeId}:${c.sectionId}` === sectionKey)) {
      setSectionKey(`${cards[0].gradeId}:${cards[0].sectionId}`)
    }
  }, [cards, sectionKey])

  useEffect(() => {
    if (!thread?.id) {
      setMessages([])
      return undefined
    }
    let live = true
    setBusy(true)
    loadMessages(thread.id).then((result) => {
      if (!live) return
      setMessages(result.messages || [])
      setBusy(false)
    })
    return () => {
      live = false
    }
  }, [thread?.id, loadMessages])

  async function openStudent(next) {
    if (!next || !user) return
    setError('')
    setStudent(next)
    setBusy(true)
    setMobilePane('room')
    const role = user.role === 'sub' ? 'sub' : user.role === 'madam' ? 'madam' : 'teacher'
    const result = await openThread({
      staffId: user.id,
      staffRole: role,
      staffName: user.name,
      studentId: next.id,
      studentName: next.name,
    })
    setBusy(false)
    if (!result?.ok) {
      setError(tx(result?.error || t('errRequest')))
      setThread(null)
      return
    }
    setThread(result.thread)
    onThreadsRefresh?.()
  }

  async function openHistoryThread(item) {
    setMode('history')
    setThread(item)
    setStudent({
      id: item.studentId,
      name: item.studentName,
      role: 'student',
    })
    setMobilePane('room')
  }

  async function send(e) {
    e.preventDefault()
    if (!thread) return
    setError('')
    const result = await onPost({
      threadId: thread.id,
      body: text,
      fileName: file?.fileName,
      fileType: file?.fileType,
      fileData: file?.fileData,
    })
    if (!result?.ok) {
      setError(tx(result?.error || t('errRequest')))
      return
    }
    setText('')
    setFile(null)
    const next = await loadMessages(thread.id)
    setMessages(next.messages || [])
    onThreadsRefresh?.()
  }

  return (
    <div className={`staff-chat-desk mode-${mode} mobile-${mobilePane}`}>
      <div className="staff-chat-tabs">
        <button type="button" className={mode === 'browse' ? 'on' : ''} onClick={() => { setMode('browse'); setMobilePane('sections') }}>
          {t('chatBrowseClasses')}
        </button>
        <button type="button" className={mode === 'history' ? 'on' : ''} onClick={() => { setMode('history'); setMobilePane('sections') }}>
          {t('chatHistory')}
          {threads.length ? <i className="tab-count">{threads.length}</i> : null}
        </button>
      </div>

      <div className="staff-chat-grid">
        <aside className="staff-chat-col staff-chat-sections">
          <div className="staff-chat-col-head">
            <strong>{mode === 'history' ? t('chatHistory') : t('chatSections')}</strong>
            <p className="muted">{mode === 'history' ? t('chatHistoryHint') : t('chatSectionsHint')}</p>
          </div>
          <div className="staff-chat-scroll">
            {mode === 'history' ? (
              threads.length === 0 ? (
                <div className="empty soft">{t('dmEmptyStaff')}</div>
              ) : (
                threads.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`staff-chat-row ${thread?.id === item.id ? 'on' : ''}`}
                    onClick={() => openHistoryThread(item)}
                  >
                    <img
                      className="wa-avatar"
                      src={displayPhoto('', item.studentName, item.studentId, 'lorelei')}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="wa-chat-text">
                      <b>{item.studentName}</b>
                      <small>
                        {item.lastMessageAt
                          ? new Date(item.lastMessageAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : t('noMessages')}
                      </small>
                    </span>
                  </button>
                ))
              )
            ) : cards.length === 0 ? (
              <div className="empty soft">{t('noClasses')}</div>
            ) : (
              cards.map((card) => {
                const key = `${card.gradeId}:${card.sectionId}`
                const count = (students || []).filter(
                  (s) => s.gradeId === card.gradeId && s.sectionId === card.sectionId,
                ).length
                return (
                  <button
                    key={key}
                    type="button"
                    className={`staff-chat-row ${sectionKey === key ? 'on' : ''}`}
                    onClick={() => {
                      setSectionKey(key)
                      setMobilePane('students')
                    }}
                  >
                    <span className="wa-chat-text">
                      <b>{t('classTitle', { grade: card.gradeName, section: card.sectionName })}</b>
                      <small>{t('studentsCountShort', { count })}</small>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {mode === 'browse' ? (
          <aside className="staff-chat-col staff-chat-students">
            <div className="staff-chat-col-head">
              <button type="button" className="ghost wa-btn staff-chat-back" onClick={() => setMobilePane('sections')}>
                {t('back')}
              </button>
              <strong>{activeCard ? t('classTitle', { grade: activeCard.gradeName, section: activeCard.sectionName }) : t('chatStudents')}</strong>
              <p className="muted">{t('chatStudentsHint')}</p>
            </div>
            <div className="staff-chat-scroll">
              {sectionStudents.length === 0 ? (
                <div className="empty soft">{t('noStudentsClass')}</div>
              ) : (
                sectionStudents.map((s) => (
                  <div
                    key={s.id}
                    className={`staff-chat-row ${student?.id === s.id ? 'on' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openStudent(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openStudent(s)
                      }
                    }}
                  >
                    <img
                      className="wa-avatar"
                      src={displayPhoto(s.photo, s.name, s.id || s.name)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="wa-chat-text">
                      <b>{s.name}</b>
                      <small>{s.rollNo ? `${t('rollNo')}: ${s.rollNo}` : t('studentRole')}</small>
                    </span>
                    <ChatIconButton className="sm" label={t('message')} onClick={() => openStudent(s)} />
                  </div>
                ))
              )}
            </div>
          </aside>
        ) : null}

        <section className="staff-chat-col staff-chat-room">
          <div className="staff-chat-col-head room-head">
            <button type="button" className="ghost wa-btn staff-chat-back" onClick={() => setMobilePane(mode === 'browse' ? 'students' : 'sections')}>
              {t('back')}
            </button>
            {student ? (
              <>
                <img
                  className="wa-avatar"
                  src={displayPhoto(student.photo, student.name, student.id || student.name)}
                  alt=""
                />
                <div className="wa-room-title">
                  <strong>{student.name}</strong>
                  <p className="muted">{t('dmStaffHint')}</p>
                </div>
              </>
            ) : (
              <div className="wa-room-title">
                <strong>{t('chatPickStudent')}</strong>
                <p className="muted">{t('chatPickStudentHint')}</p>
              </div>
            )}
          </div>

          <div className="staff-chat-thread">
            {!student ? (
              <div className="empty soft">{t('chatPickStudentHint')}</div>
            ) : busy && messages.length === 0 ? (
              <div className="muted">{t('loading')}</div>
            ) : messages.length === 0 ? (
              <div className="empty soft">{t('noMessages')}</div>
            ) : (
              messages.map((item) => (
                <article key={item.id} className={`wa-bubble ${item.authorId === user.id ? 'mine' : ''}`}>
                  <div className="wa-meta">
                    <b>{item.authorName}</b>
                    <span>
                      {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  {item.body ? <p>{item.body}</p> : null}
                  {item.fileData ? <Attachment item={item} t={t} /> : null}
                </article>
              ))
            )}
          </div>

          {student && thread ? (
            <form className="wa-composer staff-chat-composer" onSubmit={send}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('writeMessage')} />
              <label className="ghost wa-btn attach">
                {file ? file.fileName : t('attach')}
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                  onChange={async (e) => {
                    const picked = e.target.files?.[0]
                    e.target.value = ''
                    if (!picked) return
                    try {
                      setFile(await readShareFile(picked))
                      setError('')
                    } catch (err) {
                      setError(tx(err.message))
                    }
                  }}
                />
              </label>
              <button className="primary wa-btn" type="submit">
                {t('send')}
              </button>
              {error ? <div className="error">{error}</div> : null}
            </form>
          ) : null}
        </section>
      </div>
    </div>
  )
}
