import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { image, mimeType, system } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        system,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: image },
            },
            {
              type: 'text',
              text: 'Analyze this chart using the QT framework. Return ONLY valid JSON, no other text.',
            },
          ],
        }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Anthropic API error' },
        { status: 500 }
      )
    }

    const raw   = data.content?.find(b => b.type === 'text')?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()

    try {
      const result = JSON.parse(clean)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Try again.' },
        { status: 500 }
      )
    }
  } catch (e) {
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
