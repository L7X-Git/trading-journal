import { useState } from 'react'

export default function TagInput({ label, tags, onChange, placeholder = 'Type and press enter', helperText }) {
  const [value, setValue] = useState('')

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      const normalized = value.trim()
      if (normalized && !tags.includes(normalized)) {
        onChange([...tags, normalized])
      }
      setValue('')
    }
    if (event.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  const removeTag = (tag) => {
    onChange(tags.filter((item) => item !== tag))
  }

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-muted-foreground">{label}</label>}
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary/60">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary hover:text-primary/80"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
}
