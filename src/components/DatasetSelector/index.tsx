import { DATASET_OPTIONS } from '@utils/datasets'
import './DatasetSelector.css'

type DatasetSelectorProps = {
  value: string
  onChange: (datasetId: string) => void
}

export default function DatasetSelector({ value, onChange }: DatasetSelectorProps) {
  return (
    <div className="dataset-selector">
      <label className="dataset-selector-label" htmlFor="dataset-select">
        Select map
      </label>
      <select
        id="dataset-select"
        className="dataset-selector-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select map"
      >
        {DATASET_OPTIONS.map(({ id, title }) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </select>
    </div>
  )
}
