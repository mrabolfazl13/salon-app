// src/components/ui/Select.tsx
import React from 'react'
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  SelectProps as MuiSelectProps,
  MenuItem,
  FormHelperText,
} from '@mui/material'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends MuiSelectProps {
  options: SelectOption[]
  label?: string
  error?: boolean
  helperText?: string
}

const Select: React.FC<SelectProps> = ({
  options,
  label,
  error,
  helperText,
  fullWidth = true,
  size = 'medium',
  ...props
}) => {
  return (
    <FormControl fullWidth={fullWidth} error={error} size={size}>
      {label && <InputLabel>{label}</InputLabel>}
      <MuiSelect label={label} {...props}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}

export default Select