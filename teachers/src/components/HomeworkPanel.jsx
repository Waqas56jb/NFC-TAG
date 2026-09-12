import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { readShareFile } from '../lib/fileShare'

function formatWhen(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function HomeworkPanel({ gradeId, sectionId, listHomework, createHomework, deleteHomework, teacherId }) {
  const { t, lang, tx } = useI18n()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const result = await listHomework?.({ gradeId, sectionId })
    if (result?.ok) setItems(result.homework || [])
  }

  useEffect(() => {
    load()
  }, [gradeId, sectionId])

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await createHomework?.({
        title,
        body,
        dueAt: dueAt ? new Date(dueAt).toISOString() : '',
        gradeId,
        sectionId,
        fileName: file?.fileName,
        fileType: file?.fileType,
        fileData: file?.fileData,
      })
      if (!result?.ok) {
        setError(tx(result?.error || t('errRequest')))
        return
      }
      setTitle('')
      setBody('')
      setDueAt('')
      setFile(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (busy) return
    setBusy(true)
    try {
      await deleteHomework?.(id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="homework-panel">
      <form className="card" onSubmit={submit}>
        <h3>{t('hwPostTitle')}</h3>
        <p className="muted">{t('hwPostHint')}</p>
        <label className="field">
          <span>{t('hwTitleField')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={busy} />
        </label>
        <label className="field">
          <span>{t('hwBody')}</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} disabled={busy} />
        </label>
        <label className="field">
          <span>{t('hwDueField')}</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} disabled={busy} />
        </label>
        <label className="field">
          <span>{t('attach')}</span>
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
            disabled={busy}
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
          {file ? <small>{file.fileName}</small> : null}
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button className={`primary${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
          {busy ? t('working') : t('hwPost')}
        </button>
      </form>

      {!items.length ? (
        <div className="card empty">{t('hwEmpty')}</div>
      ) : (
        <div className="homework-list">
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="toolbar" style={{ marginBottom: 8 }}>
                <strong>{item.title}</strong>
                {item.teacherId === teacherId ? (
                  <button type="button" className="ghost" disabled={busy} onClick={() => remove(item.id)}>
                    {t('delete')}
                  </button>
                ) : null}
              </div>
              {item.body ? <p>{item.body}</p> : null}
              {item.dueAt ? (
                <p className="muted">
                  {t('hwDue')}: {formatWhen(item.dueAt, lang)}
                </p>
              ) : null}
              {item.fileData ? (
                <a href={item.fileData} download={item.fileName} target="_blank" rel="noreferrer">
                  {t('download')} · {item.fileName || t('file')}
                </a>
              ) : null}
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                {item.teacherName} · {formatWhen(item.createdAt, lang)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
