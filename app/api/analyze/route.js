import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { image, mimeType, system } = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            { type: 'text', text: 'Analyze this chart using the QT framework. Return only JSON.' },
          ],
        }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'API error' }, { status: 500 })
    }

    const raw   = data.content?.find(b => b.type === 'text')?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 })
  }
}
