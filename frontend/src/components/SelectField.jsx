import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

const BASE_CLASSES =
  'w-full appearance-none rounded-md border border-border bg-muted/20 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60'

const SelectField = forwardRef(function SelectField(
  { className, wrapperClassName, error, emptyAsPlaceholder = true, value, defaultValue, children, ...rest },
  ref,
) {
  const candidateValue = value !== undefined ? value : defaultValue
  const hasValue = (() => {
    if (!emptyAsPlaceholder) return true
    if (candidateValue === null || candidateValue === undefined) return false
    if (typeof candidateValue === 'string') return candidateValue !== ''
    return true
  })()

  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          BASE_CLASSES,
          hasValue ? 'text-foreground' : 'text-muted-foreground',
          error && 'border-rose-500 focus:ring-rose-500',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
})

export default SelectField
