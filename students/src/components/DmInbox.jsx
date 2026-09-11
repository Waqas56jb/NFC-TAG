import { useEffect, useRef, useState } from 'react'
import { displayPhoto } from '../lib/avatar'
import { readShareFile } from '../lib/fileShare'
import { useI18n } from '../i18n/I18nContext'

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

export function DmInbox({
  user,
  threads,
  loadMessages,
  onPost,
  peerLabel = (thread) => thread.staffName || thread.staffRole,
}) {
  const { t, lang, tx } = useI18n()
  const [activeId, setActiveId] = useState('')
  const [roomOpen, setRoomOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const threadRef = useRef(null)

  const active = threads.find((x) => x.id === activeId) || threads[0]

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
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, roomOpen])

  async function send(e) {
    e.preventDefault()
    if (!active) return
    setError('')
    const result = await onPost({
      threadId: active.id,
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

  return (
    <div className={`wa-shell dm-shell ${roomOpen ? 'room-open' : ''}`}>
      <aside className="wa-list">
        <div className="wa-list-head">
          <div>
            <p className="eyebrow">{t('dmEyebrow')}</p>
            <h2>{t('dmTitle')}</h2>
          </div>
        </div>
        <div className="wa-chats">
          {threads.length === 0 ? (
            <div className="empty soft">{t('dmEmpty')}</div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`wa-chat ${active?.id === thread.id && roomOpen ? 'on' : ''}`}
                onClick={() => {
                  setActiveId(thread.id)
                  setRoomOpen(true)
                }}
              >
                <img
                  className="wa-avatar"
                  src={displayPhoto('', peerLabel(thread), thread.id, 'lorelei')}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="wa-chat-text">
                  <b>{peerLabel(thread)}</b>
                  <small>{thread.staffRole || t('dmChat')}</small>
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
              <img
                className="wa-avatar"
                src={displayPhoto('', peerLabel(active), active.id, 'lorelei')}
                alt=""
              />
              <div className="wa-room-title">
                <strong>{peerLabel(active)}</strong>
                <p>{t('dmHint')}</p>
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
                      </div>
                    </article>
                  )
                })
              )}
            </div>
            <form className="wa-composer" onSubmit={send}>
              {file ? (
                <div className="wa-attach-chip">
                  <span>{file.fileName}</span>
                  <button type="button" onClick={() => setFile(null)}>
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
          </>
        ) : (
          <div className="empty">{t('dmEmpty')}</div>
        )}
      </section>
    </div>
  )
}
