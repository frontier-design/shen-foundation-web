import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import GlobalStyle from '../styles.js'
import { colors, fonts, type } from '../theme.js'
import { fetchDestinations, login, logout, saveVideo, uploadVideo, videoPaths } from './api.js'
import { inspectVideo, prepareVideos } from './prepare.js'

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
const seconds = (value) => `${Math.round(value)} s`

export default function Upload() {
  const [status, setStatus] = useState('loading')
  const [groups, setGroups] = useState([])
  const [loadError, setLoadError] = useState('')

  const show = useCallback(
    (request) =>
      request.then(
        (data) => {
          setGroups(data.groups)
          setStatus('ready')
        },
        (error) => {
          if (error.status === 401) return setStatus('login')
          setLoadError(error.message)
          setStatus('error')
        },
      ),
    [],
  )
  const load = useCallback(() => show(fetchDestinations()), [show])

  useEffect(() => {
    show(fetchDestinations())
  }, [show])

  const onLogout = async () => {
    await logout().catch(() => {})
    setGroups([])
    setStatus('login')
  }

  return (
    <>
      <GlobalStyle />
      <Page>
        <Header>
          <Title>Upload a video</Title>
          {status === 'ready' ? <TextButton onClick={onLogout}>Log out</TextButton> : null}
        </Header>
        {status === 'loading' ? <Muted>Loading…</Muted> : null}
        {status === 'login' ? <Login onDone={load} /> : null}
        {status === 'error' ? (
          <>
            <ErrorText>{loadError}</ErrorText>
            <Button onClick={load}>Try again</Button>
          </>
        ) : null}
        {status === 'ready' ? <Uploader groups={groups} onSaved={load} /> : null}
      </Page>
    </>
  )
}

function Login({ onDone }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(password)
      await onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={submit}>
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoFocus
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button type="submit" disabled={busy || !password}>
        {busy ? 'Checking…' : 'Log in'}
      </Button>
    </Form>
  )
}

function Uploader({ groups, onSaved }) {
  const [destinationId, setDestinationId] = useState('')
  const [caption, setCaption] = useState('')
  const [picked, setPicked] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploaded, setUploaded] = useState(null)
  const [savedLabel, setSavedLabel] = useState('')

  const destination = useMemo(
    () => groups.flatMap((group) => group.items).find((item) => item.id === destinationId),
    [groups, destinationId],
  )
  const busy = phase === 'preparing' || phase === 'uploading' || phase === 'saving'

  useEffect(() => {
    if (!busy) return undefined
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  const pickFile = async (file) => {
    if (!file || busy) return
    setError('')
    setUploaded(null)
    setPhase('idle')
    if (!file.type.startsWith('video/')) {
      setPicked(null)
      return setError('That file is not a video.')
    }
    try {
      setPicked({ file, info: await inspectVideo(file) })
    } catch (err) {
      setPicked(null)
      setError(err.message)
    }
  }

  const save = async (url) => {
    setPhase('saving')
    const result = await saveVideo(destination.id, url, destination.caption ? caption : '')
    setSavedLabel(result.label)
    setPhase('done')
    onSaved()
  }

  const start = async () => {
    setError('')
    try {
      setPhase('preparing')
      const variants = await prepareVideos(picked.file, picked.info)
      const paths = videoPaths(destination.name, variants.width, variants.height)
      const total = variants.full.size + variants.card.size
      let done = 0
      setPhase('uploading')
      setProgress(0)
      const full = await uploadVideo(paths.full, variants.full, (loaded) => setProgress((done + loaded) / total))
      done += variants.full.size
      await uploadVideo(paths.card, variants.card, (loaded) => setProgress((done + loaded) / total))
      setProgress(1)
      setUploaded(full.url)
      await save(full.url)
    } catch (err) {
      setError(err.message)
      setPhase('failed')
    }
  }

  const retrySave = async () => {
    setError('')
    try {
      await save(uploaded)
    } catch (err) {
      setError(err.message)
      setPhase('failed')
    }
  }

  const reset = () => {
    setPicked(null)
    setCaption('')
    setUploaded(null)
    setError('')
    setPhase('idle')
  }

  if (phase === 'done') {
    return (
      <Section>
        <Lead>Done. It’s in the CMS and on the preview site in about a minute.</Lead>
        <Muted>Saved to: {savedLabel}</Muted>
        <Button onClick={reset}>Upload another video</Button>
      </Section>
    )
  }

  return (
    <>
      <Section>
        <Label htmlFor="destination">1. Where should the video go?</Label>
        <Select
          id="destination"
          value={destinationId}
          disabled={busy}
          onChange={(event) => setDestinationId(event.target.value)}
        >
          <option value="">Choose a place…</option>
          {groups.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        {destination?.note ? <Muted>{destination.note}</Muted> : null}
        {destination?.replaces ? <Muted>This replaces the video that is there now.</Muted> : null}
        {destination?.caption ? (
          <>
            <Muted>The video is added at the end of the gallery. You can move it in Pages CMS.</Muted>
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              value={caption}
              maxLength={300}
              disabled={busy}
              onChange={(event) => setCaption(event.target.value)}
            />
          </>
        ) : null}
      </Section>

      <Section>
        <Label as="span">2. Choose the video</Label>
        <Drop
          $disabled={busy}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            pickFile(event.dataTransfer.files[0])
          }}
        >
          <input
            type="file"
            accept="video/*"
            disabled={busy}
            onChange={(event) => {
              pickFile(event.target.files[0])
              event.target.value = ''
            }}
          />
          {picked ? (
            <span>
              {picked.file.name}
              <Muted as="span">
                {' '}
                · {picked.info.width}×{picked.info.height} · {seconds(picked.info.duration)} ·{' '}
                {megabytes(picked.file.size)}
              </Muted>
            </span>
          ) : (
            <span>Drop a video here, or click to choose one</span>
          )}
        </Drop>
      </Section>

      <Section>
        <Notice>
          If this item is open in Pages CMS with unsaved changes, save them first. Otherwise Pages CMS
          will ask you to refresh and those changes are lost.
        </Notice>
        {phase === 'uploading' || phase === 'saving' || phase === 'preparing' ? (
          <Progress>
            <Bar style={{ transform: `scaleX(${progress})` }} />
          </Progress>
        ) : null}
        {phase === 'preparing' ? <Muted>Preparing the video…</Muted> : null}
        {phase === 'uploading' ? <Muted>Uploading… {Math.round(progress * 100)}%</Muted> : null}
        {phase === 'saving' ? <Muted>Saving to the CMS…</Muted> : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        {phase === 'failed' && uploaded ? (
          <Button onClick={retrySave}>Try saving again</Button>
        ) : (
          <Button onClick={start} disabled={busy || !destination || !picked}>
            Upload
          </Button>
        )}
      </Section>
    </>
  )
}

const Page = styled.main`
  max-width: 640px;
  margin: 0 auto;
  padding: clamp(32px, 8vh, 96px) 16px 96px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`

const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
`

const Title = styled.h1`
  ${type.titleLarge};
  font-family: ${fonts.body};
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`

const Label = styled.label`
  ${type.body};
`

const Lead = styled.p`
  ${type.gridSubtitle};
`

const Muted = styled.p`
  ${type.caption};
  color: #6b6b6b;
`

const ErrorText = styled.p`
  ${type.caption};
  color: #b42318;
`

const Notice = styled.p`
  ${type.caption};
  padding: 12px 16px;
  border: 1px solid ${colors.gray};
`

const field = `
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${colors.black};
  border-radius: 0;
  background: ${colors.white};
  color: ${colors.black};
`

const Input = styled.input`
  ${type.body};
  ${field};
`

const Select = styled.select`
  ${type.body};
  ${field};
`

const Drop = styled.label`
  ${type.body};
  position: relative;
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  border: 1px dashed ${colors.black};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  overflow-wrap: anywhere;

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: inherit;
  }
`

const Button = styled.button`
  ${type.body};
  padding: 12px 28px;
  border: 1px solid ${colors.black};
  background: ${colors.black};
  color: ${colors.white};
  cursor: pointer;

  &:disabled {
    background: ${colors.white};
    color: ${colors.gray};
    border-color: ${colors.gray};
    cursor: default;
  }
`

const TextButton = styled.button`
  ${type.caption};
  border: 0;
  background: none;
  text-decoration: underline;
  cursor: pointer;
`

const Progress = styled.div`
  width: 100%;
  height: 4px;
  background: ${colors.gray};
  overflow: hidden;
`

const Bar = styled.div`
  height: 100%;
  background: ${colors.black};
  transform-origin: left;
  transition: transform 0.2s linear;
`
