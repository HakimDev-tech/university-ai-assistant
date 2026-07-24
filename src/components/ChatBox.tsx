'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { SendHorizontal, Sparkles } from 'lucide-react'
import SourceCard from '@/components/SourceCard'

interface ChatBoxProps {
  sessionId: string
  initialMessages?: UIMessage[]
  initialSources?: Record<string, { chunkIndex: number; content: string }[]>
}

export default function ChatBox({
  sessionId,
  initialMessages = [],
  initialSources = {},
}: ChatBoxProps) {
  const [input, setInput] = useState('')
  const [sources, setSources] = useState<
    Record<string, { chunkIndex: number; content: string }[]>
  >(initialSources)

  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionId },
    }),
    onFinish: async ({ message }) => {
      try {
        const res = await fetch(
          `/api/chat/sources?sessionId=${sessionId}&messageId=${message.id}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.sources && data.sources.length > 0) {
            setSources((prev) => ({
              ...prev,
              [message.id]: data.sources,
            }))
          }
        }
      } catch (err) {
        console.error('Failed to fetch sources:', err)
      }
    },
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sources])

  const markdownComponents: Components = {
    a: ({ children }) => (
      <span className="cursor-default font-medium text-violet-600 hover:underline">
        {children}
      </span>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink-primary">{children}</strong>
    ),
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return

    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text }],
    })
    setInput('')
  }

  return (
    <div className="flex h-full max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-violet-900/5">
      {/* Messages area */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <p className="max-w-xs text-sm text-ink-muted">
              Pose une question sur ton document pour démarrer la conversation.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isUser
                    ? 'bg-violet-600 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isUser ? 'Toi' : <Sparkles className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'rounded-br-md bg-violet-600 text-white shadow-violet-600/20'
                    : 'rounded-bl-md bg-canvas-inset text-ink-primary shadow-black/5'
                }`}
              >
                <div className="prose prose-sm wrap-break-word max-w-none">
                  {message.parts?.map((part, index) => {
                    if (part.type !== 'text') return null
                    return (
                      <ReactMarkdown key={index} components={markdownComponents}>
                        {part.text}
                      </ReactMarkdown>
                    )
                  })}
                </div>

                {/* Source citations */}
                {message.role === 'assistant' &&
                  sources[message.id] &&
                  sources[message.id].length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                      {sources[message.id].map((source, idx) => (
                        <SourceCard
                          key={idx}
                          index={idx}
                          chunkId={String(source.chunkIndex ?? idx)}
                          content={source.content}
                        />
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )
        })}

        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex items-end gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-canvas-inset px-4 py-3 text-sm text-ink-muted">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error.message}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-border bg-surface p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose une question sur ton document..."
          disabled={status !== 'ready'}
          className="flex-1 rounded-full border border-border bg-canvas-inset px-4 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm shadow-violet-600/30 transition-all duration-150 hover:scale-105 hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Envoyer"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
