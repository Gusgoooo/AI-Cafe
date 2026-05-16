'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'

interface ReportViewerProps {
  slidesHTML: string
  onClose: () => void
}

export default function ReportViewer({ slidesHTML, onClose }: ReportViewerProps) {
  const deckRef = useRef<HTMLDivElement>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!deckRef.current || initialized) return

    const linkId = 'reveal-css'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css'
      document.head.appendChild(link)

      const theme = document.createElement('link')
      theme.rel = 'stylesheet'
      theme.href = 'https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/white.css'
      document.head.appendChild(theme)
    }

    import('reveal.js').then(RevealModule => {
      const Reveal = RevealModule.default
      const deck = new Reveal(deckRef.current!, {
        hash: false,
        embedded: true,
        width: 960,
        height: 700,
        margin: 0.1,
        transition: 'slide',
        backgroundTransition: 'fade',
      })
      deck.initialize()
      setInitialized(true)
    })
  }, [initialized, slidesHTML])

  function handleDownload() {
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>AI Cafe Report</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/white.css">
<style>
  .reveal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .reveal h1, .reveal h2 { font-weight: 700; }
</style>
</head>
<body>
<div class="reveal">
  <div class="slides">
    ${slidesHTML}
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"><\/script>
<script>Reveal.initialize({ hash: true, transition: 'slide' });<\/script>
</body>
</html>`

    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-cafe-report.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-neutral-400 hover:text-white cursor-pointer"
        >
          &larr; 返回
        </Button>
        <Button
          size="sm"
          onClick={handleDownload}
          className="cursor-pointer"
        >
          下载 HTML
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={deckRef}
          className="reveal"
          style={{ width: '100%', height: '100%' }}
        >
          <div
            className="slides"
            dangerouslySetInnerHTML={{ __html: slidesHTML }}
          />
        </div>
      </div>
    </div>
  )
}
