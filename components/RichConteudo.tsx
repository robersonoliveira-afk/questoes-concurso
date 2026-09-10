'use client'

import { useEffect, useRef } from 'react'

// Renderiza texto de questão: parágrafos, **negrito**, tabelas markdown
// (| a | b |) e matemática em $...$ / $$...$$ via KaTeX (carregado por CDN
// no layout). Feito à mão em vez de puxar um parser de markdown inteiro —
// o que as provas usam é só esse subconjunto.

declare global {
  interface Window {
    katex?: { renderToString: (tex: string, opts?: object) => string }
  }
}

function renderMath(el: HTMLElement) {
  if (!window.katex) return
  el.querySelectorAll<HTMLElement>('[data-tex]').forEach(n => {
    if (n.dataset.done) return
    try {
      n.innerHTML = window.katex!.renderToString(n.dataset.tex || '', {
        displayMode: n.dataset.display === '1',
        throwOnError: false,
      })
      n.dataset.done = '1'
    } catch {
      /* deixa o texto cru se o LaTeX estiver malformado */
    }
  })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
}

/** troca $...$ e $$...$$ por spans marcados; o resto vira HTML seguro */
function inline(texto: string): string {
  const partes = texto.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g)
  return partes
    .map(p => {
      if (p.startsWith('$$') && p.endsWith('$$')) {
        return `<span data-tex="${escapeHtml(p.slice(2, -2))}" data-display="1"></span>`
      }
      if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
        return `<span data-tex="${escapeHtml(p.slice(1, -1))}"></span>`
      }
      return escapeHtml(p).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    })
    .join('')
}

function blocoParaHtml(bloco: string): string {
  const linhas = bloco.split('\n')
  // tabela markdown: primeira linha com |, segunda com --- e |
  if (linhas.length >= 2 && /\|/.test(linhas[0]) && /^[\s|:-]+$/.test(linhas[1])) {
    const celulas = (l: string) =>
      l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const head = celulas(linhas[0])
    const rows = linhas.slice(2).filter(l => l.includes('|')).map(celulas)
    return (
      `<table class="my-3 w-full border-collapse text-sm">` +
      `<thead><tr>${head
        .map(c => `<th class="border border-line bg-surface2 px-2.5 py-1.5 text-left font-medium">${inline(c)}</th>`)
        .join('')}</tr></thead>` +
      `<tbody>${rows
        .map(
          r =>
            `<tr>${r
              .map(c => `<td class="border border-line px-2.5 py-1.5">${inline(c)}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody></table>`
    )
  }
  return `<p class="mb-2 last:mb-0">${inline(bloco).replace(/\n/g, '<br>')}</p>`
}

export default function RichConteudo({ texto, className = '' }: { texto: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const html = texto
    .trim()
    .split(/\n{2,}/)
    .map(blocoParaHtml)
    .join('')

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    if (window.katex) return renderMath(el)
    // KaTeX ainda carregando: tenta de novo quando o script terminar
    const t = setInterval(() => {
      if (window.katex) {
        renderMath(el)
        clearInterval(t)
      }
    }, 120)
    return () => clearInterval(t)
  }, [html])

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
