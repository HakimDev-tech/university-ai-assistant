import { GoogleGenAI } from '@google/genai'

let client: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing. Add it to the Vercel environment and redeploy.')
  if (!client) {
    client = new GoogleGenAI({ apiKey })
  }
  return client
}