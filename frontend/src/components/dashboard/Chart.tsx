import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartProps {
  title: string
  data: any[]
  type: 'line' | 'area' | 'bar'
  dataKey: string
  xAxisKey: string
  height?: number
  color?: string
}

const Chart: React.FC<ChartProps> = ({
  title,
  data,
  type,
  dataKey,
  xAxisKey,
  height = 300,
  color = '#2563eb',
}) => {
  const theme = useTheme()

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`${color}20`}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      default:
        return null
    }
  }

  return (
    <Card sx={{ borderRadius: '16px' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          {title}
        </Typography>
        <Box sx={{ height, width: '100%' }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

export default Chart