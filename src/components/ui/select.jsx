import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

function Select({ value, defaultValue, onValueChange, children }) {
  const parts = React.Children.toArray(children)
  const trigger = parts.find((child) => child.type === SelectTrigger)
  const content = parts.find((child) => child.type === SelectContent)
  const items = content ? React.Children.toArray(content.props.children).filter((child) => child.type === SelectItem) : []
  const options = items.map((item) => ({ value: item.props.value, label: item.props.children }))
  return <SelectTrigger {...trigger?.props} options={options} value={value} defaultValue={defaultValue} onValueChange={onValueChange} />
}

function SelectValue({ placeholder }) { return placeholder || null }

function SelectTrigger({ className, options = [], value, defaultValue, onValueChange, ...props }) {
  return <div className="agri-select-wrap">
    <select data-slot="select-trigger" className={cn('agri-select-trigger', className)} value={value} defaultValue={defaultValue} onChange={(event) => onValueChange?.(event.target.value)} {...props}>
      {options.map((option) => <option key={option.value} value={option.value}>{typeof option.label === 'string' ? option.label : option.value}</option>)}
    </select>
    <ChevronDown className="agri-select-chevron" aria-hidden="true" />
  </div>
}

function SelectContent({ children }) { return <>{children}</> }
function SelectItem({ value, children }) { return <option value={value}>{children}</option> }

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
