import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { image, mimeType, system, provider = 'gemini' } = await request.json()

    if (provider === 'gemini') {
      return await analyzeWithGemini(image, mimeType, system)
    } else {
      return await analyzeWithAnthropic(image, mimeType, system)
    }
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}

async function analyzeWithGemini(image, mimeType, system) {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set in Vercel environment variables. Add it at vercel.com → Settings → Environment Variables.' },
      { status: 500 }
    )
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: system + '\n\nAnalyze this chart. Return ONLY valid JSON, no markdown.' },
            { inline_data: { mime_type: mimeType, data: image } },
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
        },
      }),
    }
  )

  const data = await response.json()
  if (!response.ok) {
    const msg = data.error?.message || 'Gemini API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ error: 'Failed to parse Gemini response. Try again.' }, { status: 500 })
  }
}

async function analyzeWithAnthropic(image, mimeType, system) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' },
      { status: 500 }
    )
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: 'Analyze this chart. Return ONLY valid JSON, no other text.' },
        ],
      }],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message || 'Anthropic API error' }, { status: 500 })
  }

  const raw   = data.content?.find(b => b.type === 'text')?.text || ''
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ error: 'Failed to parse response. Try again.' }, { status: 500 })
  }
}
