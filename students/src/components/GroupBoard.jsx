import { useEffect, useMemo, useRef, useState } from 'react'
import { displayPhoto } from '../lib/avatar'
import { readShareFile } from '../lib/fileShare'
import { listClassCards } from '../lib/school'
import { useI18n } from '../i18n/I18nContext'

function GroupAvatar({ group, className = '' }) {
  const src = displayPhoto(group.photo, group.name, group.id || group.name, 'shapes')
  return <img className={`wa-avatar ${className}`.trim()} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
}

function prettyTime(iso, lang) {
  try {
    return new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function GroupBoard({
  groups,
  grades,
  allowedCards = null,
  user,
  canCreate = false,
  canDelete = false,
  canPost = true,
  loadMessages,
  onCreate,
  onPost,
  onDelete,
}) {
  const { t, lang, tx } = useI18n()
  const cards = allowedCards || listClassCards(grades)
  const visible = useMemo(() => {
    if (!allowedCards) return groups
    const keys = new Set(allowedCards.map((c) => `${c.gradeId}:${c.sectionId}`))
    const gradeIds = new Set(allowedCards.map((c) => c.gradeId))
    return groups.filter((g) => (g.sectionId ? keys.has(`${g.gradeId}:${g.sectionId}`) : gradeIds.has(g.gradeId)))
  }, [groups, allowedCards])

  const [activeId, setActiveId] = useState(visible[0]?.id || '')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ gradeId: '', sectionId: '' })
  const [roomOpen, setRoomOpen] = useState(false)
  const threadRef = useRef(null)

  const active = visible.find((g) => g.id === activeId) || visible[0]

  useEffect(() => {
    if (active && !visible.some((g) => g.id === activeId)) setActiveId(active.id)
  }, [visible, active, activeId])

  useEffect(() => {
    if (!active?.id) {
      setMessages([])
      return
    }
    let live = true
    loadMessages(active.id).then((result) => {
      if (live) setMessages(result.messages || [])
    })
    return () => {
      live = false
    }
  }, [active?.id, loadMessages])

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, roomOpen])

  const sectionChoices = cards.filter((c) => !form.gradeId || c.gradeId === form.gradeId)
  const gradeOptions = useMemo(() => {
    const seen = new Map()
    cards.forEach((c) => {
      if (!seen.has(c.gradeId)) seen.set(c.gradeId, c.gradeName)
    })
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [cards])

  async function send(e) {
    e.preventDefault()
    if (!active || !canPost) return
    setError('')
    const result = await onPost({
      groupId: active.id,
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
    const next = await loadMessages(active.id)
    setMessages(next.messages || [])
  }

  async function create(e) {
    e.preventDefault()
    const grade = gradeOptions.find((g) => g.id === form.gradeId)
    const card = cards.find((c) => c.gradeId === form.gradeId && c.sectionId === form.sectionId)
    const name = form.sectionId
      ? t('classTitle', { grade: card?.gradeName || '', section: card?.sectionName || '' })
      : `${grade?.name || ''} · ${t('allSections')}`
    const result = await onCreate({
      name,
      gradeId: form.gradeId,
      sectionId: form.sectionId,
    })
    if (result?.ok) {
      setOpen(false)
      setForm({ gradeId: '', sectionId: '' })
    }
  }

  return (
    <div className={`wa-shell ${roomOpen ? 'room-open' : ''}`}>
      <aside className="wa-list">
        <div className="wa-list-head">
          <div>
            <p className="eyebrow">{t('groupsEyebrow')}</p>
            <h2>{t('groupsTitle')}</h2>
          </div>
          {canCreate ? (
            <button className="primary" onClick={() => setOpen((v) => !v)}>
              {t('createGroup')}
            </button>
          ) : null}
        </div>
        {open ? (
          <form className="wa-create" onSubmit={create}>
            <select value={form.gradeId} onChange={(e) => setForm({ gradeId: e.target.value, sectionId: '' })} required>
              <option value="">{t('filterAllGrades')}</option>
              {gradeOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
              <option value="">{t('wholeGrade')}</option>
              {sectionChoices.map((c) => (
                <option key={c.sectionId} value={c.sectionId}>
                  {t('sectionOf', { name: c.sectionName })}
                </option>
              ))}
            </select>
            <button className="primary" type="submit">
              {t('createGroup')}
            </button>
          </form>
        ) : null}
        <div className="wa-chats">
          {visible.length === 0 ? (
            <div className="empty">{t('noGroups')}</div>
          ) : (
            visible.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`wa-chat ${active?.id === group.id && roomOpen ? 'on' : ''}`}
                onClick={() => {
                  setActiveId(group.id)
                  setRoomOpen(true)
                }}
              >
                <GroupAvatar group={group} />
                <span className="wa-chat-text">
                  <b>{group.name}</b>
                  <small>{group.scope === 'grade' ? t('wholeGrade') : t('sectionGroup')}</small>
                </span>
                <span className="wa-chat-chev" aria-hidden="true">
                  ›
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="wa-room">
        {active ? (
          <>
            <header className="wa-room-head">
              <button type="button" className="wa-back" onClick={() => setRoomOpen(false)} aria-label={t('back')}>
                ‹
              </button>
              <GroupAvatar group={active} />
              <div className="wa-room-title">
                <strong>{active.name}</strong>
                <p>{t('groupHint')}</p>
              </div>
            </header>

            <div className="wa-thread" ref={threadRef}>
              {messages.length === 0 ? (
                <div className="wa-empty-chat">
                  <p>{t('noMessages')}</p>
                </div>
              ) : (
                messages.map((item) => {
                  const mine = item.authorId === user.id
                  return (
                    <article key={item.id} className={`wa-bubble ${mine ? 'mine' : ''}`}>
                      {!mine ? (
                        <div className="wa-meta">
                          <b>{item.authorName}</b>
                          <span>{item.authorRole}</span>
                        </div>
                      ) : null}
                      {item.body ? <p>{item.body}</p> : null}
                      {item.fileData ? <Attachment item={item} t={t} /> : null}
                      <div className="wa-bubble-foot">
                        <time>{prettyTime(item.createdAt, lang)}</time>
                        {canDelete ? (
                          <button
                            type="button"
                            className="linkish"
                            onClick={() =>
                              onDelete(item.id).then(async () => setMessages((await loadMessages(active.id)).messages || []))
                            }
                          >
                            {t('delete')}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            {canPost ? (
              <form className="wa-composer" onSubmit={send}>
                {file ? (
                  <div className="wa-attach-chip">
                    <span>{file.fileName}</span>
                    <button type="button" onClick={() => setFile(null)} aria-label={t('delete')}>
                      ×
                    </button>
                  </div>
                ) : null}
                <div className="wa-composer-row">
                  <label className="wa-attach-btn" title={t('attach')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                      <path d="M21.4 11.6 12 21a5 5 0 0 1-7.1-7.1l9.2-9.2a3.2 3.2 0 0 1 4.5 4.5L9.2 18.6a1.4 1.4 0 1 1-2-2l8.1-8.1" />
                    </svg>
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
                  <input
                    className="wa-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('writeMessage')}
                    enterKeyHint="send"
                  />
                  <button className="wa-send" type="submit" aria-label={t('send')} disabled={!text.trim() && !file}>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3.4 20.6 21 12 3.4 3.4 3 10.2l11 1.8L3 13.8z" />
                    </svg>
                  </button>
                </div>
                {error ? <div className="error">{error}</div> : null}
              </form>
            ) : (
              <div className="wa-readonly">{t('groupViewOnly')}</div>
            )}
          </>
        ) : (
          <div className="empty">{t('noGroups')}</div>
        )}
      </section>
    </div>
  )
}

function Attachment({ item, t }) {
  if (item.fileType?.startsWith('image/')) {
    return <img className="wa-media" src={item.fileData} alt={item.fileName} />
  }
  if (item.fileType?.startsWith('video/')) {
    return <video className="wa-media" src={item.fileData} controls />
  }
  return (
    <a className="wa-file" href={item.fileData} download={item.fileName}>
      {t('download')} · {item.fileName || t('file')}
    </a>
  )
}
