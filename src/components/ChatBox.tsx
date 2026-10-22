'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { ArrowUp, BookOpenText, LoaderCircle, Square, FileSearch, Pencil, GitBranch, X } from 'lucide-react'
import SourceCard from '@/components/SourceCard'

interface BranchOption { id: string; name: string }
interface ChatBoxProps {
  sessionId: string
  branchId: string
  branchName: string
  branches: BranchOption[]
  initialMessages?: UIMessage[]
  initialSources?: Record<string, { id: string; chunkIndex: number; content: string }[]>
}

export default function ChatBox({ sessionId, branchId, branchName, branches, initialMessages = [], initialSources = {} }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editError, setEditError] = useState('')
  const [sources, setSources] = useState<Record<string, { id: string; chunkIndex: number; content: string }[]>>(initialSources)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const shouldAutoScroll = useRef(true)
  const autoSentBranch = useRef<string | null>(null)
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: { sessionId, branchId },
  }), [sessionId, branchId])

  const { messages, sendMessage, status, error, stop } = useChat({
    id: `${sessionId}:${branchId}`,
    messages: initialMessages,
    transport,
    onFinish: async ({ message }) => {
      try {
        const res = await fetch(`/api/chat/sources?sessionId=${encodeURIComponent(sessionId)}&messageId=${encodeURIComponent(message.id)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.sources) && data.sources.length > 0) setSources(prev => ({ ...prev, [message.id]: data.sources }))
        }
      } catch { /* Source cards are supplementary; the answer remains readable. */ }
    },
  })

  useEffect(() => {
    if (!shouldAutoScroll.current || !scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sources])

  useEffect(() => {
    if (autoSentBranch.current === branchId) return
    const key = `margin-draft:${branchId}`
    const draft = window.sessionStorage.getItem(key)
    if (!draft) return
    window.sessionStorage.removeItem(key)
    autoSentBranch.current = branchId
    void sendMessage({ role: 'user', parts: [{ type: 'text', text: draft }] })
  }, [branchId, sendMessage])

  const markdownComponents: Components = {
    a: ({ children, href }) => {
      if (href?.startsWith('#source-')) {
        const chunkId = href.slice('#source-'.length)
        return <button type="button" className="mx-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md border border-brand-300/30 bg-brand-300/10 px-1 text-[10px] font-semibold leading-5 text-brand-700 align-baseline hover:border-brand-300/70 hover:bg-brand-300/20" aria-label={`Open source ${String(children)}`} title={`Open source ${String(children)}`} onClick={() => {
          const target = document.getElementById(`source-${chunkId}`)
          target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const toggle = target?.querySelector('button')
          if (toggle?.getAttribute('aria-expanded') !== 'true') toggle?.click()
        }}>{children}</button>
      }
      return <span className="text-brand-700 underline decoration-brand-300 underline-offset-2">{children}</span>
    },
    strong: ({ children }) => <strong className="font-semibold text-ink-primary">{children}</strong>,
    code: ({ children }) => <code className="rounded-md bg-canvas-hover px-1.5 py-0.5 font-mono text-[.9em]">{children}</code>,
    h1: ({ children }) => <h3 className="mb-2 mt-4 font-display text-xl">{children}</h3>,
    h2: ({ children }) => <h4 className="mb-2 mt-4 font-display text-lg">{children}</h4>,
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return
    if (editingMessageId) {
      setEditError('')
      try {
        const res = await fetch('/api/chat/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, branchId, messageId: editingMessageId }),
        })
        const data = await res.json()
        if (!res.ok || typeof data.branchId !== 'string') throw new Error(data.error || 'Could not create a version')
        window.sessionStorage.setItem(`margin-draft:${data.branchId}`, text)
        window.location.href = `/chat/${sessionId}?branchId=${encodeURIComponent(data.branchId)}`
      } catch (err) {
        setEditError(err instanceof Error ? err.message : 'The edited prompt could not be saved.')
      }
      return
    }
    setInput('')
    if (composerRef.current) composerRef.current.style.height = 'auto'
    await sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (status !== 'ready' || !input.trim()) return
      const form = composerRef.current?.form
      if (form) form.requestSubmit()
    }
  }

  const busy = status === 'submitted' || status === 'streaming'

  return (
    <section className="chat-frame" aria-label="Document study conversation">
      <div className="chat-topline">
        <div className="flex min-w-0 items-center gap-2">
          <span className="chat-topline-icon"><BookOpenText size={16} strokeWidth={1.7} /></span>
          <div className="min-w-0">
            <div className="text-xs font-semibold">Study conversation</div>
            <div className="eyebrow mt-1">{busy ? 'Reasoning / checking scope' : 'Source-linked study'}</div>
          </div>
        </div>
        <label className="branch-picker">
          <GitBranch size={14} />
          <span className="sr-only">Conversation version</span>
          <select value={branchId} onChange={e => { window.location.href = `/chat/${sessionId}?branchId=${encodeURIComponent(e.target.value)}` }} aria-label="Conversation version">
            {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}{branch.id === branchId ? ' · current' : ''}</option>)}
          </select>
        </label>
      </div>

      <div ref={scrollRef} className="chat-scroll" onScroll={e => {
        const el = e.currentTarget
        shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140
      }}>
        {messages.length === 0 && (
          <div className="flex min-h-[320px] flex-col items-start justify-center px-2">
            <span className="eyebrow">Study / {branchName}</span>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-tight">Read closer.<br />Understand better.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-ink-secondary">Ask about a definition, compare concepts, or work through an exercise. Margin keeps the session focused on this course and marks what comes from outside the document.</p>
            <div className="mt-7 flex items-center gap-2 border-t border-border pt-4 text-xs text-ink-muted">
              <FileSearch size={15} /> Course evidence first. Relevant gaps can be filled; unrelated questions are redirected.
            </div>
          </div>
        )}

        {messages.map(message => {
          const isUser = message.role === 'user'
          const text = message.parts?.filter(part => part.type === 'text').map(part => part.text).join('') ?? ''
          return (
            <article key={message.id} className={`chat-message ${isUser ? 'chat-message-user' : ''}`}>
              <div className="message-mark" aria-label={isUser ? 'You' : 'Margin'}>{isUser ? 'YOU' : 'm.'}</div>
              <div className="min-w-0">
                <div className="eyebrow mb-2">{isUser ? 'Your question' : 'Study note / AI response'}</div>
                <div className="message-row-content">
                  <div className="message-content">
                    {message.parts?.map((part, index) => {
                      if (part.type !== 'text') return null
                      return <ReactMarkdown key={index} components={markdownComponents}>{part.text}</ReactMarkdown>
                    })}
                  </div>
                  {isUser && (
                    <button type="button" className="edit-prompt-button" title="Edit this prompt in a new version" aria-label="Edit this prompt in a new version" disabled={busy} onClick={() => {
                      setEditingMessageId(message.id)
                      setInput(text)
                      setEditError('')
                      composerRef.current?.focus()
                    }}><Pencil size={14} /></button>
                  )}
                </div>
                {!isUser && sources[message.id]?.length > 0 && (
                  <div className="mt-3">
                    <div className="eyebrow mb-2">Evidence / {String(sources[message.id].length).padStart(2, '0')} passages</div>
                    {sources[message.id].map((source, idx) => (
                      <SourceCard key={`${message.id}-${source.chunkIndex}-${idx}`} index={idx} chunkId={source.id} chunkIndex={source.chunkIndex} content={source.content} />
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {busy && (
          <div className="chat-message">
            <div className="message-mark">m.</div>
            <div>
              <div className="eyebrow mb-2">Checking the material</div>
              <div className="message-content flex items-center gap-2 text-ink-secondary">
                <LoaderCircle size={14} className="animate-spin" /> Checking whether this belongs to the study topic…
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div role="alert" className="border-t border-error/30 bg-error-bg px-4 py-3 text-xs leading-5 text-error">The response could not be completed. Your previous study thread is preserved. Try again or check the service configuration.</div>}
      {editError && <div role="alert" className="border-t border-error/30 bg-error-bg px-4 py-3 text-xs leading-5 text-error">{editError}</div>}

      <form onSubmit={onSubmit} className="chat-composer">
        {editingMessageId && <button type="button" className="cancel-edit-button" title="Cancel prompt edit" aria-label="Cancel prompt edit" onClick={() => { setEditingMessageId(null); setInput(''); setEditError('') }}><X size={15} /></button>}
        <label className="sr-only" htmlFor="study-question">Ask a question about this document</label>
        <textarea
          ref={composerRef}
          id="study-question"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onComposerKeyDown}
          onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 180)}px` }}
          placeholder={editingMessageId ? 'Edit prompt — a new version will be created…' : 'Ask about a concept, passage, or example…'}
          disabled={busy}
        />
        {busy ? (
          <button type="button" onClick={() => stop()} className="btn-secondary !min-h-[46px] !px-4" aria-label="Stop response"><Square size={14} /></button>
        ) : (
          <button type="submit" disabled={!input.trim() || status !== 'ready'} className="btn-primary !min-h-[46px] !px-4" aria-label={editingMessageId ? 'Save edited prompt as new version' : 'Send question'}><ArrowUp size={16} /> <span className="hidden sm:inline">{editingMessageId ? 'Branch & retry' : 'Ask'}</span></button>
        )}
      </form>
      <div className="chat-footnote"><span>ENTER ↵ send</span><span>SHIFT + ENTER new line</span><span>Editing a prompt creates an independent version.</span></div>
    </section>
  )
}
