import { useRef, useState, type ChangeEvent } from 'react'
import type { ImportResult } from '@utils/datasetIo'
import {
  DrawerActionButton,
  DrawerActionRow,
} from '../shared/DrawerActionButton'
import DrawerSectionHeader from '../shared/DrawerSectionHeader'
import './FilesMode.css'

type DatasetIoPanelProps = {
  onDownload: () => void
  onImportFile: (file: File) => Promise<ImportResult>
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

export default function DatasetIoPanel({
  onDownload,
  onImportFile,
}: DatasetIoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const openPicker = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus({ kind: 'loading' })
    try {
      const result = await onImportFile(file)
      if (result.ok === false) {
        setStatus({ kind: 'error', message: result.error })
        return
      }
      setStatus({ kind: 'success', message: result.payload.message })
    } catch {
      setStatus({ kind: 'error', message: 'Could not read the selected file.' })
    }
  }

  return (
    <section className="places-dataset-io">
      <DrawerSectionHeader
        title="Dataset files"
        hint="Download or load a .zip with markers.json (categories + markers required; meta and collapses optional — meta is generated if missing). Loaded data replaces the current map."
      >
        <DrawerActionRow>
          <DrawerActionButton onClick={onDownload}>Download zip</DrawerActionButton>
          <DrawerActionButton
            variant="cancel"
            onClick={openPicker}
            disabled={status.kind === 'loading'}
          >
            {status.kind === 'loading' ? 'Loading…' : 'Load zip'}
          </DrawerActionButton>
        </DrawerActionRow>
      </DrawerSectionHeader>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(event) => {
          void handleFileChange(event)
        }}
      />
      {status.kind === 'success' || status.kind === 'error' ? (
        <p
          className={`places-dataset-io-status ${
            status.kind === 'error' ? 'is-error' : 'is-success'
          }`}
          role="status"
        >
          {status.message}
        </p>
      ) : null}
    </section>
  )
}
