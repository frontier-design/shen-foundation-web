import { buildDestinations } from '../_lib/destinations.js'
import { readContent } from '../_lib/github.js'
import { fail, guard, json } from '../_lib/http.js'

export async function GET(request) {
  const denied = guard(request)
  if (denied) return denied
  try {
    return json({ groups: buildDestinations(await readContent()) })
  } catch (error) {
    console.error(error)
    return fail('Could not load the list of pages from the CMS. Try again in a minute.', 502)
  }
}
