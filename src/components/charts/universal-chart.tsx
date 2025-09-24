import { useMemo, useRef } from "react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";

interface UniversalChartProps {
  data: any;
  chartType: 'line' | 'bar' | 'pie' | 'xmr' | 'table';
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  insights?: string[];
}

export default function UniversalChart({ 
  data, 
  chartType, 
  title, 
  xAxisKey = 'name', 
  yAxisKey = 'value',
  insights = [] 
}: UniversalChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Comprehensive debug logging
  console.log('UniversalChart received:', { 
    chartType, 
    chartTypeType: typeof chartType,
    chartTypeValue: JSON.stringify(chartType),
    title, 
    dataLength: data?.length, 
    data,
    xAxisKey,
    yAxisKey
  });

  // Normalize and validate chart type
  const normalizedChartType = useMemo(() => {
    if (!chartType || typeof chartType !== 'string') {
      console.warn('Invalid chart type:', chartType, 'Falling back to bar chart');
      return 'bar';
    }
    
    const normalized = chartType.toLowerCase().trim();
    const validTypes = ['line', 'bar', 'pie', 'xmr', 'table'];
    
    if (validTypes.includes(normalized)) {
      return normalized as 'line' | 'bar' | 'pie' | 'xmr' | 'table';
    }
    
    console.warn('Unknown chart type:', chartType, 'Falling back to bar chart');
    return 'bar';
  }, [chartType]);

  console.log('Normalized chart type:', normalizedChartType);
  
  // Normalize data for different chart types
  const { chartData, stats } = useMemo(() => {
    try {
      console.log('🔍 UniversalChart data normalization:', {
        data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        chartType: normalizedChartType
      });
      
      if (!data) {
        console.log('❌ No data provided to UniversalChart');
        return { chartData: [], stats: null };
      }

      // Handle different data formats
      if (Array.isArray(data)) {
        const arr = data as any[];
        if (arr.length === 0) return { chartData: [], stats: null };
        
        const values = arr.map((p) => {
          if (typeof p === 'number') return p;
          if (typeof p === 'object' && p !== null) {
            return p[yAxisKey] ?? p.value ?? p.y ?? 0;
          }
          return 0;
        }).filter(v => !isNaN(v));
        
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const sd = values.length > 1 ? Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (values.length - 1)) : 0;
        
        const normalizedData = arr.map((p, i) => {
          const name = (p && typeof p === 'object' && (p[xAxisKey] ?? p.label ?? p.x)) ?? String(i + 1);
          const value = typeof p === 'number' ? p : (p && typeof p === 'object' ? (p[yAxisKey] ?? p.value ?? p.y ?? 0) : 0);
          return {
            name: String(name),
            value: Number(value) || 0,
            average: avg,
            UCL: avg + 3 * sd,
            LCL: avg - 3 * sd,
            isSignal: false
          };
        });
        
        console.log('🔍 Normalized chart data:', {
          originalData: arr,
          normalizedData,
          xAxisKey,
          yAxisKey,
          avg,
          sd
        });
        
        return {
          chartData: normalizedData,
          stats: {
            centralLine: avg,
            averageMovingRange: 0,
            UCL_Individual: avg + 3 * sd,
            LCL_Individual: avg - 3 * sd,
            UCL_MovingRange: 0,
            LCL_MovingRange: 0,
            individualSignals: [],
            rangeSignals: [],
            dataPoints: values.length,
            validRanges: Math.max(0, values.length - 1),
            invalidRanges: 0
          }
        };
      }

      // Handle structured data
      if (data && typeof data === 'object' && (data as any).chartData && (data as any).statistics) {
        const d = data as any;
        return {
          chartData: (d.chartData || []).map((point: any) => ({
            name: String(point.label || point.name || 'Unknown'),
            value: Number(point.individual || point.value || 0) || 0,
            average: Number(point.centralLine || point.average || 0) || 0,
            UCL: Number(point.UCL || 0) || 0,
            LCL: Number(point.LCL || 0) || 0,
            isSignal: Boolean(point.isIndividualSignal || false)
          })),
          stats: d.statistics
        };
      }

      return { chartData: [], stats: null };
    } catch (error) {
      console.error('Error normalizing chart data:', error);
      return { chartData: [], stats: null };
    }
  }, [data, xAxisKey, yAxisKey]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isXmR = normalizedChartType === 'xmr';
      
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-slate-800">{label}</p>
            {isXmR && data.isSignal && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                ⚠️ Signal
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Value:</span>
              <span className="text-sm font-semibold text-slate-800">{formatValue(data.value)}</span>
            </div>
            {isXmR && data.average && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Average:</span>
                <span className="text-sm font-medium text-slate-700">{formatValue(data.average)}</span>
              </div>
            )}
            {isXmR && data.UCL && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">UCL:</span>
                <span className="text-sm font-medium text-red-600">{formatValue(data.UCL)}</span>
              </div>
            )}
            {isXmR && data.LCL && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">LCL:</span>
                <span className="text-sm font-medium text-red-600">{formatValue(data.LCL)}</span>
              </div>
            )}
            {!isXmR && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Hover over other points to explore the data
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const exportChart = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `${title?.replace(/[^a-zA-Z0-9]/g, '_') || 'chart'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  const renderChart = () => {
    // Handle empty data
    console.log('🔍 Final chartData check:', {
      chartData,
      chartDataLength: chartData?.length,
      hasData: !!(chartData && chartData.length > 0)
    });
    
    if (!chartData || chartData.length === 0) {
      console.log('❌ No chart data available, showing fallback message');
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <p className="text-sm">No data available for chart</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (normalizedChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)', stroke: '#3b82f6', strokeWidth: 1 }}
                animationDuration={200}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#2563eb"
                radius={[2, 2, 0, 0]}
                stroke="#1d4ed8"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart {...commonProps}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'xmr':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '3 3' }}
                animationDuration={200}
              />
              <Legend />
              
              {/* Control Limits for XmR charts */}
              {stats && (
                <>
                  <ReferenceLine 
                    y={stats.UCL_Individual} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ value: "UCL", position: "right", style: { fill: '#ef4444', fontWeight: 'bold' } }}
                  />
                  <ReferenceLine 
                    y={stats.centralLine} 
                    stroke="#64748b" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{ value: "Average", position: "right", style: { fill: '#64748b', fontWeight: 'bold' } }}
                  />
                  <ReferenceLine 
                    y={stats.LCL_Individual} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ value: "LCL", position: "right", style: { fill: '#ef4444', fontWeight: 'bold' } }}
                  />
                </>
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 3, fill: "#ffffff", strokeDasharray: '5 5' }}
                name="Values"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '3 3' }}
                animationDuration={200}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 3, fill: "#ffffff", strokeDasharray: '5 5' }}
                name="Values"
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Handle table chart type (fallback to bar chart)
  if (normalizedChartType === 'table') {
    console.log('Table chart type detected, rendering as bar chart with data:', data);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              {title || 'Data Visualization'}
            </h4>
            <p className="text-sm text-slate-600">Table data rendered as bar chart</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div ref={chartRef} className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={formatValue}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)', stroke: '#3b82f6', strokeWidth: 1 }}
                  animationDuration={200}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#2563eb"
                  radius={[2, 2, 0, 0]}
                  stroke="#1d4ed8"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  // Handle invalid chart type (this should never happen now due to normalization)
  if (!['line', 'bar', 'pie', 'xmr', 'table'].includes(normalizedChartType)) {
    console.error('Invalid normalized chart type:', normalizedChartType, 'Supported types: line, bar, pie, xmr, table');
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              {title || 'Chart'}
            </h4>
            <p className="text-sm text-red-600">Invalid chart type: {normalizedChartType}</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="h-80 w-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <p className="text-sm">Unsupported chart type</p>
              <p className="text-xs mt-1">Supported types: line, bar, pie, xmr, table</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              {title || `${normalizedChartType.charAt(0).toUpperCase() + normalizedChartType.slice(1)} Chart`}
            </h4>
            <p className="text-sm text-slate-600">
              {normalizedChartType === 'xmr' ? 'Individual values with control limits' : 
               normalizedChartType === 'bar' ? 'Bar chart visualization' :
               normalizedChartType === 'pie' ? 'Pie chart visualization' :
               normalizedChartType === 'table' ? 'Table data visualization' :
               'Line chart visualization'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div ref={chartRef} className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error rendering UniversalChart:', error);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              {title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
            </h4>
            <p className="text-sm text-red-600">Error rendering chart</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="h-80 w-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <p className="text-sm">Failed to render chart</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}
