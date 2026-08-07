// src/components/ui/Tabs.tsx
import React, { useState } from 'react'
import {
  Tabs as MuiTabs,
  Tab as MuiTab,
  TabsProps as MuiTabsProps,
  Box,
} from '@mui/material'

export interface TabItem {
  label: string
  value: string | number
  content: React.ReactNode
}

export interface TabsProps extends Omit<MuiTabsProps, 'onChange'> {
  tabs: TabItem[]
  defaultTab?: string | number
  onChange?: (value: string | number) => void
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  ...props
}) => {
  const [value, setValue] = useState(defaultTab || tabs[0]?.value || 0)

  const handleChange = (_: React.SyntheticEvent, newValue: string | number) => {
    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <Box>
      <MuiTabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        {...props}
        sx={{
          '& .MuiTab-root': {
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          },
          ...props.sx,
        }}
      >
        {tabs.map((tab) => (
          <MuiTab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </MuiTabs>
      <Box sx={{ mt: 3 }}>
        {tabs.find((tab) => tab.value === value)?.content}
      </Box>
    </Box>
  )
}

export default Tabs