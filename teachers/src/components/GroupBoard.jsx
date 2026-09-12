import { useEffect, useMemo, useState } from 'react'
import { displayPhoto } from '../lib/avatar'
import { readPhoto } from '../lib/photo'
import { readShareFile } from '../lib/fileShare'
import { cleanPersonName, roleLabel } from '../lib/roles'
import { listClassCards } from '../lib/school'
import { useI18n } from '../i18n/I18nContext'

function GroupAvatar({ group }) {
  const src = displayPhoto(group.photo, group.name, group.id || group.name, 'shapes')
  return <img className="wa-avatar" src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
}

export function GroupBoard({
  groups,
  grades,
  allowedCards = null,
  user,
  canCreate = false,
  canDelete = false,
  canPost = true,
  canEditPhoto = false,
  loadMessages,
  onCreate,
  onPost,
  onDelete,
  onUpdatePhoto,
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
  const [form, setForm] = useState({ gradeId: '', sectionId: '', photo: '' })
  const [roomOpen, setRoomOpen] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)

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
    if (!active || !canPost || sending) return
    setError('')
    setSending(true)
    try {
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
    } finally {
      setSending(false)
    }
  }

  async function create(e) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      const grade = gradeOptions.find((g) => g.id === form.gradeId)
      const card = cards.find((c) => c.gradeId === form.gradeId && c.sectionId === form.sectionId)
      const name = form.sectionId
        ? t('classTitle', { grade: card?.gradeName || '', section: card?.sectionName || '' })
        : `${grade?.name || ''} · ${t('allSections')}`
      const result = await onCreate({
        name,
        gradeId: form.gradeId,
        sectionId: form.sectionId,
        photo: form.photo || undefined,
      })
      if (result?.ok) {
        setOpen(false)
        setForm({ gradeId: '', sectionId: '', photo: '' })
      }
    } finally {
      setCreating(false)
    }
  }

  async function onPickGroupPhoto(e, mode) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    try {
      const photo = await readPhoto(picked)
      if (mode === 'create') {
        setForm((f) => ({ ...f, photo }))
        return
      }
      if (!active?.id || !onUpdatePhoto) return
      setPhotoBusy(true)
      setError('')
      const result = await onUpdatePhoto(active.id, photo)
      if (!result?.ok) setError(tx(result?.error || t('errRequest')))
    } catch (err) {
      setError(tx(err.message))
    } finally {
      setPhotoBusy(false)
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
            <button type="button" className="primary wa-btn" onClick={() => setOpen((v) => !v)}>
              {t('createGroup')}
            </button>
          ) : null}
        </div>
        {open ? (
          <form className="wa-create" onSubmit={create}>
            <div className="wa-create-photo">
              <img
                className="wa-avatar lg"
                src={displayPhoto(form.photo, t('createGroup'), 'new-group', 'shapes')}
                alt=""
              />
              <label className="ghost wa-btn">
                {form.photo ? t('changePhoto') : t('uploadGroupPhoto')}
                <input type="file" hidden accept="image/*" onChange={(e) => onPickGroupPhoto(e, 'create')} />
              </label>
            </div>
            <select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value, sectionId: '' })} required>
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
            <button className={`primary wa-btn${creating ? ' is-loading' : ''}`} type="submit" disabled={creating}>
              {creating ? <span className="btn-spinner" aria-hidden="true" /> : null}
              <span>{creating ? t('working') : t('createGroup')}</span>
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
                className={`wa-chat ${active?.id === group.id ? 'on' : ''}`}
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
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="wa-room">
        {active ? (
          <>
            <header className="wa-room-head">
              <button type="button" className="ghost wa-btn wa-back" onClick={() => setRoomOpen(false)}>
                {t('back')}
              </button>
              <GroupAvatar group={active} />
              <div className="wa-room-title">
                <strong>{active.name}</strong>
                <p className="muted">{t('groupHint')}</p>
              </div>
              {canEditPhoto ? (
                <label className="ghost wa-btn wa-photo-btn">
                  {photoBusy ? '…' : t('changePhoto')}
                  <input type="file" hidden accept="image/*" disabled={photoBusy} onChange={(e) => onPickGroupPhoto(e, 'edit')} />
                </label>
              ) : null}
            </header>
            <div className="wa-thread">
              {messages.length === 0 ? (
                <div className="empty">{t('noMessages')}</div>
              ) : (
                messages.map((item) => (
                  <article key={item.id} className={`wa-bubble ${item.authorId === user.id ? 'mine' : ''}`}>
                    <div className="wa-meta">
                      <b>{cleanPersonName(item.authorName, item.authorRole) || roleLabel(item.authorRole, t)}</b>
                      <span>{roleLabel(item.authorRole, t)}</span>
                      {canDelete ? (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() =>
                            onDelete(item.id).then(async () =>
                              setMessages((await loadMessages(active.id)).messages || []),
                            )
                          }
                        >
                          {t('delete')}
                        </button>
                      ) : null}
                    </div>
                    {item.body ? <p>{item.body}</p> : null}
                    {item.fileData ? <Attachment item={item} t={t} /> : null}
                    <small>{new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}</small>
                  </article>
                ))
              )}
            </div>
            {canPost ? (
              <form className="wa-composer" onSubmit={send}>
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
                <button className={`primary wa-btn${sending ? ' is-loading' : ''}`} type="submit" disabled={sending}>
                  {sending ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  <span>{sending ? t('working') : t('send')}</span>
                </button>
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
