import { useEffect, useRef, useState } from 'react'
import { readShareFile } from '../lib/fileShare'
import { useI18n } from '../i18n/I18nContext'
import { Modal } from './Modal'

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

export function StaffDmModal({ open, student, user, onClose, openThread, loadMessages, onPost }) {
  const { t, lang, tx } = useI18n()
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!open || !student || !user) return undefined
    let live = true
    setBusy(true)
    setError('')
    openThread({
      staffId: user.id,
      staffRole: user.role === 'sub' ? 'sub' : user.role === 'madam' ? 'madam' : 'teacher',
      staffName: user.name,
      studentId: student.id,
      studentName: student.name,
    }).then(async (result) => {
      if (!live) return
      if (!result?.ok) {
        setError(tx(result?.error || t('errRequest')))
        setBusy(false)
        return
      }
      setThread(result.thread)
      const msgs = await loadMessages(result.thread.id)
      if (live) {
        setMessages(msgs.messages || [])
        setBusy(false)
      }
    })
    return () => {
      live = false
    }
  }, [open, student?.id, user?.id])

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  if (!open || !student) return null

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
  }

  return (
    <Modal wide hideSubmit title={t('dmWith', { name: student.name })} hint={t('dmStaffHint')} onClose={onClose}>
      <div className="staff-dm">
        {busy ? <div className="muted">{t('loading') || 'Loading…'}</div> : null}
        <div className="staff-dm-thread">
          {messages.length === 0 && !busy ? <div className="empty soft">{t('noMessages')}</div> : null}
          {messages.map((item) => (
            <article key={item.id} className={`staff-dm-bubble ${item.authorId === user.id ? 'mine' : ''}`}>
              <div className="wa-meta">
                <b>{item.authorName}</b>
                <span>{new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}</span>
              </div>
              {item.body ? <p>{item.body}</p> : null}
              {item.fileData ? <Attachment item={item} t={t} /> : null}
            </article>
          ))}
          <div ref={endRef} />
        </div>
        <form className="staff-dm-compose" onSubmit={send}>
          {file ? (
            <div className="wa-attach-chip">
              <span>{file.fileName}</span>
              <button type="button" onClick={() => setFile(null)}>
                ×
              </button>
            </div>
          ) : null}
          <div className="staff-dm-row">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('writeMessage')} />
            <label className="ghost attach">
              {t('attach')}
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
            <button className="primary" type="submit">
              {t('send')}
            </button>
          </div>
          {error ? <div className="error">{error}</div> : null}
        </form>
      </div>
    </Modal>
  )
}
