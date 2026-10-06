// An error whose message is written for the editor and shown in "Video status".
export class EditorError extends Error {}

export const megabytes = (bytes) => {
  const mb = bytes / 1_000_000
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}
