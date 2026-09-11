import { useEffect, useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const unread = user ? unreadCount(announcements, user.role, user.id) : 0

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && user) markAnnouncementsSeen(user.role, user.id)
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

  return (
    <div className={`bell-wrap${open ? ' is-open' : ''}`}>
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

      {open ? (
        <>
          <button type="button" className="bell-scrim" aria-label={t('close')} onClick={() => setOpen(false)} />
          <div className="bell-panel" role="dialog" aria-modal="true" aria-label={t('navAnnouncements')}>
            <div className="bell-grab" aria-hidden="true" />
            <header className="bell-head">
              <div className="bell-head-copy">
                <p className="bell-kicker">{t('brand')}</p>
                <strong>{t('navAnnouncements')}</strong>
              </div>
              <button type="button" className="bell-x" onClick={() => setOpen(false)} aria-label={t('close')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            {canPost ? (
              <form className="bell-form" onSubmit={submit}>
                <fieldset disabled={busy} className="modal-fields">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('announceTitle')}
                    required
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows="3"
                    placeholder={t('announceBody')}
                  />
                </fieldset>
                <button className={`primary bell-post${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
                  {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  <span>{busy ? t('working') : t('postAnnounce')}</span>
                </button>
              </form>
            ) : (
              <p className="muted bell-note">{t('announceViewOnly')}</p>
            )}

            <div className="bell-list">
              {announcements.length === 0 ? (
                <div className="bell-empty">
                  <span className="bell-empty-ico" aria-hidden="true" />
                  <p>{t('noAnnouncements')}</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <article key={item.id} className="bell-item">
                    <div className="bell-item-top">
                      <strong>{item.title}</strong>
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
                    {item.body ? <p>{item.body}</p> : null}
                    <small>
                      {item.authorName} ·{' '}
                      {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </small>
                  </article>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
