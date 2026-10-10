import { describe, expect, it } from 'vitest'
import { readSse } from './sse'

function streamOf(chunks: string[]): Response {
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c))
      controller.close()
    },
  })
  return new Response(body)
}

async function collect(chunks: string[]) {
  const out = []
  for await (const m of readSse(streamOf(chunks))) out.push(m)
  return out
}

describe('readSse', () => {
  it('parses CRLF events and skips keep-alive comments', async () => {
    const msgs = await collect([
      'event: progress\r\ndata: {"node":"intake"}\r\n\r\n',
      ': ping\r\n\r\n',
      'event: result\r\ndata: {"ok":true}\r\n\r\n',
    ])
    expect(msgs).toEqual([
      { event: 'progress', data: '{"node":"intake"}' },
      { event: 'result', data: '{"ok":true}' },
    ])
  })

  it('handles CRLF split across chunks', async () => {
    const msgs = await collect(['event: progress\r', '\ndata: {"node":"triage"}\r', '\n\r', '\n'])
    expect(msgs).toEqual([{ event: 'progress', data: '{"node":"triage"}' }])
  })
})
