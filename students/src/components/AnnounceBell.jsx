import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { markAnnouncementsSeen, unreadCount } from '../lib/fileShare'
import { useI18n } from '../i18n/I18nContext'

export function AnnounceBell({
  announcements = [],
  user,
  canPost = false,
  onPost,
  onDelete,
}) {
  const { t, lang } = useI18n()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [host, setHost] = useState(null)
  const role = user?.role || 'student'
  const unread = user ? unreadCount(announcements, role, user.id) : 0

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    const app = host
    if (app) app.classList.add('bell-open')
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (app) app.classList.remove('bell-open')
    }
  }, [open, host])

  function toggle() {
    const next = !open
    if (next) {
      const el =
        wrapRef.current?.closest('.phone-app') || document.querySelector('.phone-app')
      setHost(el)
      if (user) markAnnouncementsSeen(role, user.id)
    }
    setOpen(next)
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const result = await onPost?.({ title, body })
      if (result?.ok) {
        setTitle('')
        setBody('')
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (deletingId) return
    setDeletingId(id)
    try {
      await onDelete?.(id)
    } finally {
      setDeletingId('')
    }
  }

  const sheet = (
    <div className="bell-layer" role="dialog" aria-modal="true" aria-label={t('navAnnouncements')}>
      <button type="button" className="bell-scrim" aria-label={t('close')} onClick={() => setOpen(false)} />
      <div className="bell-sheet">
        <div className="bell-grab" aria-hidden="true" />
        <header className="bell-sheet-head">
          <div className="bell-sheet-copy">
            <p className="bell-kicker">{t('brand')}</p>
            <h2>{t('navAnnouncements')}</h2>
            <p className="bell-sub muted">{t('announceViewOnly')}</p>
          </div>
          <button type="button" className="bell-x" onClick={() => setOpen(false)} aria-label={t('close')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {canPost ? (
          <form className="bell-compose" onSubmit={submit}>
            <fieldset disabled={busy} className="modal-fields">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('announceTitle')} required />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows="3" placeholder={t('announceBody')} />
            </fieldset>
            <button className={`primary${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
              {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
              <span>{busy ? t('working') : t('postAnnounce')}</span>
            </button>
          </form>
        ) : null}

        <div className="bell-feed">
          {announcements.length === 0 ? (
            <div className="bell-empty">
              <span className="bell-empty-ico" aria-hidden="true" />
              <p>{t('noAnnouncements')}</p>
            </div>
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="bell-card">
                <div className="bell-card-avatar" aria-hidden="true">
                  {(item.authorName || '?').slice(0, 1)}
                </div>
                <div className="bell-card-body">
                  <div className="bell-card-top">
                    <strong>{item.title}</strong>
                    <time>
                      {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  {item.body ? <p>{item.body}</p> : null}
                  <div className="bell-card-foot">
                    <span>{item.authorName}</span>
                    {canPost && (user?.role === 'madam' || user?.id === item.authorId) ? (
                      <button
                        type="button"
                        className="bell-del"
                        disabled={Boolean(deletingId)}
                        onClick={() => remove(item.id)}
                      >
                        {deletingId === item.id ? t('working') : t('delete')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        className={`bell-btn${unread ? ' has-unread' : ''}`}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t('navAnnouncements')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread ? <i>{unread > 9 ? '9+' : unread}</i> : null}
      </button>
      {open && host ? createPortal(sheet, host) : null}
    </div>
  )
}
