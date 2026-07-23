'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
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
  const [sources, setSources] = useState<Record<string, { chunkIndex: number; content: string }[]>>(initialSources)

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        sessionId,
      },
    }),
    onFinish: async ({ message }) => {
    // When the assistant finishes, fetch the sources for this message
    try {
      const res = await fetch(`/api/chat/sources?sessionId=${sessionId}&messageId=${message.id}`)
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
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, sources])

  const markdownComponents: Components = {
    a: ({ children }) => (
      <span className="text-blue-500 hover:underline font-medium cursor-default">
        {children}
      </span>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const text = input.trim()

    if (!text || status !== 'ready') {
      return
    }

    await sendMessage({
      role: 'user',
      parts: [
        {
          type: 'text',
          text,
        },
      ],
    })

    setInput('')
  }

  return (
    <div className="flex h-full max-h-[80vh] flex-col rounded-lg border bg-white shadow">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>Ask a question about your document to start the conversation.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div
                className={`prose prose-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'prose-invert'
                    : ''
                }`}
              >
                {message.parts?.map((part, index) => {
                  if (part.type !== 'text') {
                    return null
                  }

                  return (
                    <ReactMarkdown
                      key={index}
                      components={markdownComponents}
                    >
                      {part.text}
                    </ReactMarkdown>
                  )
                })}
              </div>

              {/* Source cards for assistant messages */}
              {message.role === 'assistant' && sources[message.id] && sources[message.id].length > 0 && (
                <div className="mt-3 space-y-1">
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
        ))}

        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-lg bg-gray-100 p-3 text-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="border-t bg-red-50 px-4 py-2 text-sm text-red-500">
          {error.message}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex border-t p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your document..."
          disabled={status !== 'ready'}
          className="flex-1 rounded-l border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="rounded-r bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}