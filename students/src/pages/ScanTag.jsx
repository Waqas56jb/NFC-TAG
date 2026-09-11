import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { extractTagCodeFromText } from '../lib/nfcTag'

async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-aman-tesseract]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('OCR script failed')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'
    s.async = true
    s.dataset.amanTesseract = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('OCR script failed'))
    document.head.appendChild(s)
  })
  if (!window.Tesseract) throw new Error('OCR not available')
  return window.Tesseract
}

/**
 * Camera tag reader — no QR code.
 * 1) Chrome TextDetector when available
 * 2) Tesseract OCR fallback (reads unique CODE under أمان)
 * 3) Manual code entry always available
 */
export function ScanTag() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const busyRef = useRef(false)
  const foundRef = useRef(false)
  const [status, setStatus] = useState('idle')
  const [hint, setHint] = useState('')
  const [manual, setManual] = useState('')
  const [error, setError] = useState('')
  const [engine, setEngine] = useState('')

  useEffect(() => {
    let live = true
    let timer = 0

    function stopTracks() {
      streamRef.current?.getTracks?.().forEach((tr) => tr.stop())
      streamRef.current = null
    }

    function go(code) {
      if (foundRef.current || !code) return
      foundRef.current = true
      setStatus('found')
      setHint(t('scanFound', { code }))
      stopTracks()
      navigate(`/c/${code}`, { replace: true })
    }

    async function readFrame(video) {
      const canvas = canvasRef.current
      if (!canvas || !video) return ''
      const w = video.videoWidth || 640
      const h = video.videoHeight || 480
      if (w < 32 || h < 32) return ''
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, 0, 0, w, h)
      // Boost contrast for OCR
      const img = ctx.getImageData(0, 0, w, h)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
        const v = g > 140 ? 255 : 0
        d[i] = d[i + 1] = d[i + 2] = v
      }
      ctx.putImageData(img, 0, 0)
      return canvas
    }

    async function start() {
      setError('')
      setStatus('starting')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (!live) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setStatus('scanning')
        setHint(t('scanHint'))

        let detector = null
        if ('TextDetector' in window) {
          try {
            detector = new window.TextDetector()
            setEngine('text')
          } catch {
            detector = null
          }
        }

        let tesseractWorker = null
        if (!detector) {
          setEngine('ocr')
          setHint(t('scanOcrLoading'))
          try {
            const Tesseract = await loadTesseract()
            tesseractWorker = await Tesseract.createWorker('eng')
            if (!live) {
              await tesseractWorker.terminate()
              return
            }
            setHint(t('scanHint'))
          } catch (err) {
            setHint(t('scanManualOnly'))
            setError(err.message || t('scanOcrFail'))
          }
        }

        const tick = async () => {
          if (!live || foundRef.current) return
          if (busyRef.current) {
            timer = window.setTimeout(tick, 400)
            return
          }
          const videoEl = videoRef.current
          if (!videoEl || videoEl.readyState < 2) {
            timer = window.setTimeout(tick, 400)
            return
          }
          busyRef.current = true
          try {
            if (detector) {
              const texts = await detector.detect(videoEl)
              for (const item of texts || []) {
                const code = extractTagCodeFromText(item.rawValue || '')
                if (code) {
                  go(code)
                  return
                }
              }
            } else if (tesseractWorker) {
              const canvas = await readFrame(videoEl)
              if (canvas) {
                const result = await tesseractWorker.recognize(canvas)
                const code = extractTagCodeFromText(result?.data?.text || '')
                if (code) {
                  await tesseractWorker.terminate()
                  go(code)
                  return
                }
              }
            }
          } catch {
            /* keep going */
          } finally {
            busyRef.current = false
          }
          timer = window.setTimeout(tick, detector ? 400 : 1200)
        }
        tick()
      } catch (err) {
        setStatus('error')
        setError(err.message || t('scanCameraDenied'))
        setHint(t('scanManualOnly'))
      }
    }

    start()
    return () => {
      live = false
      window.clearTimeout(timer)
      stopTracks()
    }
  }, [navigate, t])

  function submitManual(e) {
    e.preventDefault()
    const code = extractTagCodeFromText(manual) || manual.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length < 6) {
      setError(t('scanCodeShort'))
      return
    }
    navigate(`/c/${code}`)
  }

  return (
    <main className="scan-page">
      <div className="scan-card">
        <p className="scan-kicker">أمان · AMAN</p>
        <h1>{t('scanTitle')}</h1>
        <p className="scan-lead">{t('scanLead')}</p>

        <div className="scan-video-wrap">
          <video ref={videoRef} className="scan-video" playsInline muted autoPlay />
          <div className="scan-frame" aria-hidden="true" />
        </div>
        <canvas ref={canvasRef} className="scan-canvas-hidden" aria-hidden="true" />

        <p className="scan-status">
          {status === 'starting' || status === 'idle' ? t('scanStarting') : null}
          {status === 'scanning' ? t('scanLooking') : null}
          {status === 'found' ? hint : null}
          {engine === 'ocr' && status === 'scanning' ? ` · ${t('scanEngineOcr')}` : null}
        </p>
        {hint && status === 'scanning' ? <p className="scan-hint">{hint}</p> : null}
        {error ? <p className="scan-error">{error}</p> : null}

        <form className="scan-manual" onSubmit={submitManual}>
          <label>
            <span>{t('scanEnterCode')}</span>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              placeholder="MTXA7LRRMH7R"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <button className="scan-btn" type="submit">
            {t('scanOpenProfile')}
          </button>
        </form>

        <Link className="scan-back" to="/login">
          {t('publicParentLogin')}
        </Link>
      </div>
    </main>
  )
}
