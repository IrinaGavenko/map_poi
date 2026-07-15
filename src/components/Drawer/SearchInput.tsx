type SearchInputProps = {
  query: string
  onQueryChange: (value: string) => void
}

export default function SearchInput({ query, onQueryChange }: SearchInputProps) {
  return (
    <div className="places-search">
      <div className="places-search-field">
        <input
          placeholder="Search places..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="places-search-clear"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
