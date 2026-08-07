// src/components/ui/Table.tsx
import React from 'react'
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableProps as MuiTableProps,
  Paper,
} from '@mui/material'
import { motion } from 'framer-motion'

export interface TableProps extends MuiTableProps {
  columns: Array<{
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
  }>
  data: Array<Record<string, any>>
  onRowClick?: (row: any) => void
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  ...props
}) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <MuiTable {...props}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align || 'right'}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'right'}>
                  {row[col.key]}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  )
}

export default Table