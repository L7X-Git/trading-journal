import { useEffect, useMemo, useRef, useState } from 'react'

export default function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options',
  helperText,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
  }, [options, search])

  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="space-y-1">
      {label && <label className="block text-sm font-medium text-muted-foreground">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((value) => {
                const option = options.find((opt) => opt.value === value)
                return (
                  <span
                    key={value}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {option ? option.label : value}
                  </span>
                )
              })}
            </div>
          )}
        </button>
        {isOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-card shadow-lg">
            <div className="border-b border-border p-2">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-2">
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches found</p>
              ) : (
                filteredOptions.map((option) => {
                  const isChecked = selectedValues.includes(option.value)
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOption(option.value)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )}
