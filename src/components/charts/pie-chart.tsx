import { useMemo, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";
import { fileLogger } from "@/lib/file-logger";

interface PieChartProps {
  data: any;
  title?: string;
  insights?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function PieChartComponent({ data, title, insights = [], xAxisKey = 'name', yAxisKey = 'value' }: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Ensure axis keys are valid (not empty strings)
  const effectiveXAxisKey = xAxisKey && xAxisKey.trim() ? xAxisKey.trim() : 'name';
  const effectiveYAxisKey = yAxisKey && yAxisKey.trim() ? yAxisKey.trim() : 'value';
  
  // Normalize and process data
  const { chartData, stats } = useMemo(() => {
    if (!data) {
      return { chartData: [], stats: null };
    }

    // Handle array of data points
    if (Array.isArray(data)) {
      const arr = data as any[];
      if (arr.length === 0) return { chartData: [], stats: null };
      
      // Auto-detect yAxisKey if not provided or doesn't exist in data
      let detectedYAxisKey = effectiveYAxisKey;
      if (arr.length > 0 && arr[0] && typeof arr[0] === 'object') {
        const firstPoint = arr[0];
        const allKeys = Object.keys(firstPoint);
        // If yAxisKey is default "value" and data doesn't have "value", try to detect it
        if (effectiveYAxisKey === 'value' && !('value' in firstPoint)) {
          // Find the first numeric key that's not an x-axis key
          const xAxisKeys = ['name', 'label', 'x', 'month', 'date', 'category', effectiveXAxisKey];
          const numericKey = allKeys.find(k => {
            if (xAxisKeys.includes(k)) return false;
            const val = firstPoint[k];
            return typeof val === 'number' && !isNaN(val) && isFinite(val);
          });
          if (numericKey) {
            detectedYAxisKey = numericKey;
            console.log(`🔍 PieChart: Auto-detected yAxisKey as "${detectedYAxisKey}" from data`);
            fileLogger.info('PIE_CHART', `Auto-detected yAxisKey`, {
              originalYAxisKey: effectiveYAxisKey,
              detectedYAxisKey,
              allKeys,
              samplePoint: firstPoint
            });
          }
        }
      }
      
      const normalizedData = arr.map((p, i) => {
        // Extract name
        const name = (p && typeof p === 'object' && (p[effectiveXAxisKey] ?? p.label ?? p.x ?? p.name)) ?? String(i + 1);
        
        // Extract value - use robust extraction logic (same as bar chart)
        let value: number | undefined = undefined;
        
        if (typeof p === 'number') {
          value = p;
        } else if (p && typeof p === 'object') {
          // Try multiple possible value keys
          const possibleKeys = [
            detectedYAxisKey,
            effectiveYAxisKey,
            'value', 
            'y', 
            'amount', 
            'count', 
            'total', 
            'sum',
            'sales',
            'revenue',
            'quantity'
          ];
          
          // Step 1: Try the detected/specified yAxisKey first
          const keyToTry = detectedYAxisKey !== 'value' ? detectedYAxisKey : effectiveYAxisKey;
          if (keyToTry && p[keyToTry] !== undefined && p[keyToTry] !== null) {
            const candidate = p[keyToTry];
            if (typeof candidate === 'number' && !isNaN(candidate) && isFinite(candidate)) {
              value = candidate;
            } else if (typeof candidate === 'string' && candidate.trim()) {
              const parsed = parseFloat(candidate);
              if (!isNaN(parsed) && isFinite(parsed)) {
                value = parsed;
              }
            }
          }
          
          // Step 2: Try common keys from the predefined list
          if (value === undefined) {
            for (const key of possibleKeys) {
              if (!key || !key.trim()) continue;
              if (key === detectedYAxisKey || key === effectiveYAxisKey) continue;
              
              if (p[key] !== undefined && p[key] !== null) {
                const candidate = p[key];
                if (typeof candidate === 'number' && !isNaN(candidate) && isFinite(candidate)) {
                  value = candidate;
                  break;
                } else if (typeof candidate === 'string' && candidate.trim()) {
                  const parsed = parseFloat(candidate);
                  if (!isNaN(parsed) && isFinite(parsed)) {
                    value = parsed;
                    break;
                  }
                }
              }
            }
          }
          
          // Step 3: If still no value, try ALL keys in the object
          if (value === undefined && p && typeof p === 'object') {
            const allKeys = Object.keys(p);
            const actualXAxisKey = allKeys.find(k => {
              const val = p[k];
              return typeof val === 'string' && (k === effectiveXAxisKey || k === 'name' || k === 'label' || k === 'x' || k === 'month' || k === 'date' || k === 'category');
            });
            
            for (const key of allKeys) {
              if (key === effectiveXAxisKey || key === actualXAxisKey || key === 'name' || key === 'label' || key === 'x' || key === 'month' || key === 'date' || key === 'category') {
                continue;
              }
              
              const candidate = p[key];
              if (candidate === undefined || candidate === null) continue;
              
              if (typeof candidate === 'number' && !isNaN(candidate) && isFinite(candidate)) {
                value = candidate;
                break;
              } else if (typeof candidate === 'string' && candidate.trim()) {
                const parsed = parseFloat(candidate);
                if (!isNaN(parsed) && isFinite(parsed)) {
                  value = parsed;
                  break;
                }
              }
            }
          }
        }
        
        let finalValue = 0;
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            finalValue = numValue;
          }
        }
        
        return {
          name: String(name),
          value: finalValue
        };
      });

      // Calculate statistics
      const values = normalizedData.map(d => d.value).filter(v => !isNaN(v) && v !== null && v > 0);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length ? sum / values.length : 0;
      const max = values.length ? Math.max(...values) : 0;
      const min = values.length ? Math.min(...values.filter(v => v > 0)) : 0;
      
      // Find largest and smallest segments
      const sorted = [...normalizedData].sort((a, b) => b.value - a.value);
      const largest = sorted[0];
      const smallest = sorted.filter(d => d.value > 0).slice(-1)[0];

      // Calculate percentages
      const withPercentages = normalizedData.map(d => ({
        ...d,
        percentage: sum > 0 ? (d.value / sum) * 100 : 0
      }));

      return {
        chartData: withPercentages,
        stats: {
          total: sum,
          average: avg,
          max,
          min,
          count: values.length,
          largest,
          smallest,
          categories: normalizedData.length
        }
      };
    }

    // Handle structured data
    if (data && typeof data === 'object' && (data as any).chartData) {
      const d = data as any;
      const chartDataArray = (d.chartData || []).map((point: any) => ({
        name: String(point.label || point.name || 'Unknown'),
        value: Number(point.value || 0) || 0
      }));
      
      const sum = chartDataArray.reduce((acc: number, p: any) => acc + p.value, 0);
      const withPercentages = chartDataArray.map((d: any) => ({
        ...d,
        percentage: sum > 0 ? (d.value / sum) * 100 : 0
      }));

      return {
        chartData: withPercentages,
        stats: d.statistics || null
      };
    }

    return { chartData: [], stats: null };
  }, [data, effectiveXAxisKey, effectiveYAxisKey]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatExactValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Value:</span> {formatExactValue(data.value)}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Percentage:</span> {data.percentage?.toFixed(2) || '0.00'}%
            </p>
            {stats && stats.total > 0 && (
              <p className="text-sm text-slate-600">
                <span className="font-medium">Share:</span> {
                  data.percentage >= 50 ? 'Majority' :
                  data.percentage >= 25 ? 'Significant' :
                  data.percentage >= 10 ? 'Moderate' :
                  'Minor'
                }
              </p>
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
      link.download = `pie-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  // Show message if no data
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-4 border-amber-200 bg-amber-50">
        <div className="text-center text-amber-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">No Data Available</p>
          <p className="text-xs mt-1">Please ensure your data contains valid values for charting</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-800">{title || 'Pie Chart'}</h4>
          <p className="text-sm text-slate-600">Proportional distribution visualization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportChart}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div ref={chartRef} className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => {
                  if (percentage < 3) return ''; // Hide labels for small slices
                  return `${name}: ${percentage.toFixed(1)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={400}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-3">
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.total)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Categories</div>
              <div className="text-lg font-semibold text-slate-800">
                {stats.categories}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Average</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.average)}
              </div>
            </Card>
          </div>

          {/* Largest and Smallest Segments */}
          {stats.largest && stats.smallest && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-emerald-200 bg-emerald-50">
                <div className="text-sm text-emerald-700 mb-1">Largest Segment</div>
                <div className="text-lg font-semibold text-emerald-800 mb-1">
                  {stats.largest.name}
                </div>
                <div className="text-sm text-emerald-600">
                  {formatExactValue(stats.largest.value)} ({stats.largest.percentage?.toFixed(1) || '0'}%)
                </div>
              </Card>
              <Card className="p-4 border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-700 mb-1">Smallest Segment</div>
                <div className="text-lg font-semibold text-slate-800 mb-1">
                  {stats.smallest.name}
                </div>
                <div className="text-sm text-slate-600">
                  {formatExactValue(stats.smallest.value)} ({stats.smallest.percentage?.toFixed(1) || '0'}%)
                </div>
              </Card>
            </div>
          )}

          {/* Segment Breakdown */}
          <Card className="p-4">
            <h5 className="font-medium text-slate-800 mb-3">Segment Breakdown</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chartData
                .sort((a: any, b: any) => b.value - a.value)
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center space-x-3 flex-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-700 flex-1">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.percentage?.toFixed(1) || '0.0'}%
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-slate-800 ml-4">
                      {formatExactValue(item.value)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
            <h5 className="font-medium text-blue-800">Insights</h5>
          </div>
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <div key={index} className="text-sm text-blue-700">{insight}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

