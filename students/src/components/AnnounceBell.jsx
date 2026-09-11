import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { markAnnouncementsSeen, unreadCount } from '../lib/fileShare'
import { useI18n } from '../i18n/I18nContext'

function relativeTime(iso, lang) {
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - then)
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (lang === 'ar') {
      if (mins < 1) return 'الآن'
      if (mins < 60) return `منذ ${mins} د`
      if (hours < 24) return `منذ ${hours} س`
      if (days < 7) return `منذ ${days} ي`
    } else {
      if (mins < 1) return 'Just now'
      if (mins < 60) return `${mins}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
    }
    return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

function initial(name) {
  return (name || 'A').trim().charAt(0).toUpperCase()
}

function portalRoot() {
  if (typeof document === 'undefined') return null
  return document.querySelector('.phone-app') || document.body
}

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
  const [freshCount, setFreshCount] = useState(0)
  const [mountNode, setMountNode] = useState(() => portalRoot())
  const unread = user ? unreadCount(announcements, user.role, user.id) : 0

  useEffect(() => {
    setMountNode(portalRoot())
  }, [open])

  function toggle() {
    const next = !open
    if (next) {
      setFreshCount(unread)
      if (user) markAnnouncementsSeen(user.role, user.id)
    }
    setOpen(next)
  }

  function close() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const app = document.querySelector('.phone-app')
    const prev = app?.style.overflow
    if (app) app.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      if (app) app.style.overflow = prev || ''
    }
  }, [open])

  async function submit(e) {
    e.preventDefault()
    const result = await onPost?.({ title, body })
    if (result?.ok) {
      setTitle('')
      setBody('')
    }
  }

  const sheet =
    open && mountNode
      ? createPortal(
          <div className="bell-layer">
            <button type="button" className="bell-scrim" aria-label={t('close')} onClick={close} />
            <div className="bell-sheet" role="dialog" aria-modal="true" aria-label={t('navAnnouncements')}>
              <div className="bell-grab" aria-hidden="true" />
              <header className="bell-sheet-head">
                <div className="bell-sheet-copy">
                  <p className="bell-kicker">{t('school')}</p>
                  <h2>{t('navAnnouncements')}</h2>
                  <p className="bell-sub">{canPost ? t('announceBody') : t('announceViewOnly')}</p>
                </div>
                <button type="button" className="bell-x" onClick={close} aria-label={t('close')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </header>

              {canPost ? (
                <form className="bell-compose" onSubmit={submit}>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('announceTitle')} required />
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows="3" placeholder={t('announceBody')} />
                  <button className="primary" type="submit">
                    {t('postAnnounce')}
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
                  announcements.map((item, index) => (
                    <article key={item.id} className={`bell-card${index < freshCount ? ' fresh' : ''}`}>
                      <div className="bell-card-avatar" aria-hidden="true">
                        {initial(item.authorName)}
                      </div>
                      <div className="bell-card-body">
                        <div className="bell-card-top">
                          <strong>{item.title}</strong>
                          <time>{relativeTime(item.createdAt, lang)}</time>
                        </div>
                        {item.body ? <p>{item.body}</p> : null}
                        <div className="bell-card-foot">
                          <span>{item.authorName}</span>
                          {item.authorRole ? <em>{item.authorRole}</em> : null}
                          {canPost && (user?.role === 'madam' || user?.id === item.authorId) ? (
                            <button type="button" className="bell-del" onClick={() => onDelete?.(item.id)}>
                              {t('delete')}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>,
          mountNode,
        )
      : null

  return (
    <div className="bell-wrap">
      <button className={`bell-btn${unread ? ' has-unread' : ''}`} type="button" onClick={toggle} aria-label={t('navAnnouncements')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread ? <i>{unread > 9 ? '9+' : unread}</i> : null}
      </button>
      {sheet}
    </div>
  )
}
