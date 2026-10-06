export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

export const fail = (message, status = 400) => json({ error: message }, status)

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
