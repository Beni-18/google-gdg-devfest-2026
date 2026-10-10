// Minimal Server-Sent Events reader for fetch() responses (EventSource cannot POST).

export interface SseMessage {
  event: string
  data: string
}

export function parseSseBlock(block: string): SseMessage | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue // blank or keep-alive comment
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length ? { event, data: data.join('\n') } : null
}

export async function* readSse(response: Response): AsyncGenerator<SseMessage> {
  if (!response.body) return
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = '' // normalised to \n line endings
  let carry = '' // a trailing \r whose \n may arrive in the next chunk
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    let chunk = carry + value
    carry = chunk.endsWith('\r') ? '\r' : ''
    if (carry) chunk = chunk.slice(0, -1)
    buffer += chunk.replace(/\r\n?/g, '\n')
    let end: number
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const message = parseSseBlock(buffer.slice(0, end))
      buffer = buffer.slice(end + 2)
      if (message) yield message
    }
  }
  const tail = parseSseBlock(buffer)
  if (tail) yield tail
}
