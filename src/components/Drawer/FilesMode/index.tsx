import type { ImportResult } from '@utils/datasetIo'
import DrawerShell from '../DrawerShell'
import '../drawer.css'
import DatasetIoPanel from './DatasetIoPanel'

type FilesModeProps = {
  open: boolean
  expanded: boolean
  onMinimize: () => void
  onExpand: () => void
  onDownloadDataset: () => void
  onImportDatasetFile: (file: File) => Promise<ImportResult>
}

export default function FilesMode({
  open,
  expanded,
  onMinimize,
  onExpand,
  onDownloadDataset,
  onImportDatasetFile,
}: FilesModeProps) {
  const minimized = open && !expanded

  return (
    <DrawerShell
      open={open}
      minimized={minimized}
      onClose={onMinimize}
      onExpand={onExpand}
    >
      <button
        type="button"
        className="places-drawer-handle places-drawer-handle--button"
        aria-label={minimized ? 'Open dataset files panel' : undefined}
        onClick={minimized ? onExpand : undefined}
      />

      <div className="places-drawer-body">
        <DatasetIoPanel
          onDownload={onDownloadDataset}
          onImportFile={onImportDatasetFile}
        />
      </div>
    </DrawerShell>
  )
}
