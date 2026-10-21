'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { ArrowUp, BookOpenText, LoaderCircle, Square, FileSearch } from 'lucide-react'
import SourceCard from '@/components/SourceCard'

interface ChatBoxProps {
  sessionId: string
  initialMessages?: UIMessage[]
  initialSources?: Record<string, { id: string; chunkIndex: number; content: string }[]>
}

export default function ChatBox({ sessionId, initialMessages = [], initialSources = {} }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const [sources, setSources] = useState<Record<string, { chunkIndex: number; content: string }[]>>(initialSources)
  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, error, stop } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: '/api/chat', body: { sessionId } }),
    onFinish: async ({ message }) => {
      try {
        const res = await fetch(`/api/chat/sources?sessionId=${encodeURIComponent(sessionId)}&messageId=${encodeURIComponent(message.id)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.sources) && data.sources.length > 0) {
            setSources(prev => ({ ...prev, [message.id]: data.sources }))
          }
        }
      } catch (err) {
        console.error('Source lookup failed', err)
      }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sources])

  const markdownComponents: Components = {
    a: ({ children }) => <span className="text-brand-700 underline decoration-brand-300 underline-offset-2">{children}</span>,
    strong: ({ children }) => <strong className="font-semibold text-ink-primary">{children}</strong>,
    code: ({ children }) => <code className="bg-canvas-hover px-1 py-0.5 font-mono text-[.9em]">{children}</code>,
    h1: ({ children }) => <h3 className="mb-2 mt-4 font-display text-xl">{children}</h3>,
    h2: ({ children }) => <h4 className="mb-2 mt-4 font-display text-lg">{children}</h4>,
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return
    setInput('')
    if (composerRef.current) composerRef.current.style.height = 'auto'
    await sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (status === 'ready' && input.trim()) {
        void sendMessage({ role: 'user', parts: [{ type: 'text', text: input.trim() }] })
        setInput('')
      }
    }
  }

  const busy = status === 'submitted' || status === 'streaming'

  return (
    <section className="chat-frame" aria-label="Document study conversation">
      <div className="chat-topline">
        <div className="flex items-center gap-2">
          <BookOpenText size={16} strokeWidth={1.5} />
          <span className="text-xs font-semibold">Study conversation</span>
        </div>
        <span className="eyebrow">{busy ? 'Working / retrieving sources' : 'Source-first mode'}</span>
      </div>

      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="flex min-h-[320px] flex-col items-start justify-center px-2">
            <span className="eyebrow">Start with a question</span>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-tight">Read closer.<br />Understand better.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-ink-secondary">Ask about a definition, compare two concepts, or request a step-by-step explanation from the material linked to this thread.</p>
            <div className="mt-7 flex items-center gap-2 border-t border-border pt-4 text-xs text-ink-muted">
              <FileSearch size={15} /> Answers may be incomplete when your document does not contain enough evidence.
            </div>
          </div>
        )}

        {messages.map(message => {
          const isUser = message.role === 'user'
          return (
            <article key={message.id} className={`chat-message ${isUser ? 'chat-message-user' : ''}`}>
              <div className="message-mark" aria-label={isUser ? 'You' : 'Margin'}>{isUser ? 'YOU' : 'm.'}</div>
              <div className="min-w-0">
                <div className="eyebrow mb-2">{isUser ? 'Your question' : 'Study note / AI response'}</div>
                <div className="message-content">
                  {message.parts?.map((part, index) => {
                    if (part.type !== 'text') return null
                    return <ReactMarkdown key={index} components={markdownComponents}>{part.text}</ReactMarkdown>
                  })}
                </div>
                {!isUser && sources[message.id]?.length > 0 && (
                  <div className="mt-3">
                    <div className="eyebrow mb-2">Evidence / {String(sources[message.id].length).padStart(2, '0')} passages</div>
                    {sources[message.id].map((source, idx) => (
                      <SourceCard key={`${message.id}-${source.chunkIndex}-${idx}`} index={idx} chunkId={source.id} content={source.content} />
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
                <LoaderCircle size={14} className="animate-spin" /> Finding passages that may support an answer…
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div role="alert" className="border-t border-error/30 bg-error-bg px-4 py-3 text-xs leading-5 text-error">
          The response could not be completed. Your previous study thread is preserved. Try again, or check the service configuration.
        </div>
      )}

      <form onSubmit={onSubmit} className="chat-composer">
        <label className="sr-only" htmlFor="study-question">Ask a question about this document</label>
        <textarea
          ref={composerRef}
          id="study-question"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onComposerKeyDown}
          onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 150)}px` }}
          placeholder="Ask about a concept, passage, or example…"
          disabled={busy}
        />
        {busy ? (
          <button type="button" onClick={() => stop()} className="btn-secondary !min-h-[44px] !px-3" aria-label="Stop response"><Square size={14} /></button>
        ) : (
          <button type="submit" disabled={!input.trim() || status !== 'ready'} className="btn-primary !min-h-[44px] !px-4" aria-label="Send question"><ArrowUp size={16} /> <span className="hidden sm:inline">Ask</span></button>
        )}
      </form>
      <div className="border-t border-border px-4 py-2 text-[10px] text-ink-muted">
        Enter to ask · Shift + Enter for a new line · Verify important claims against the cited passage.
      </div>
    </section>
  )
}
