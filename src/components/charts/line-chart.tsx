import { useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";
import { fileLogger } from "@/lib/file-logger";

interface LineChartProps {
  data: any;
  title?: string;
  insights?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
}

export default function LineChartComponent({ data, title, insights = [], xAxisKey = 'name', yAxisKey = 'value' }: LineChartProps) {
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
            console.log(`🔍 LineChart: Auto-detected yAxisKey as "${detectedYAxisKey}" from data`);
            fileLogger.info('LINE_CHART', `Auto-detected yAxisKey`, {
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
      const values = normalizedData.map(d => d.value).filter(v => !isNaN(v) && v !== null);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length ? sum / values.length : 0;
      const max = values.length ? Math.max(...values) : 0;
      const min = values.length ? Math.min(...values) : 0;
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted.length 
        ? sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

      // Calculate trend and changes
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let changePercent = 0;
      let firstValue = 0;
      let lastValue = 0;
      
      if (values.length >= 2) {
        firstValue = values[0];
        lastValue = values[values.length - 1];
        changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        
        if (changePercent > 5) trend = 'up';
        else if (changePercent < -5) trend = 'down';
        else trend = 'stable';
      }

      // Find peaks and valleys
      const peaks: Array<{ index: number; value: number; name: string }> = [];
      const valleys: Array<{ index: number; value: number; name: string }> = [];
      
      for (let i = 1; i < normalizedData.length - 1; i++) {
        const prev = normalizedData[i - 1].value;
        const curr = normalizedData[i].value;
        const next = normalizedData[i + 1].value;
        
        if (curr > prev && curr > next) {
          peaks.push({ index: i, value: curr, name: normalizedData[i].name });
        }
        if (curr < prev && curr < next) {
          valleys.push({ index: i, value: curr, name: normalizedData[i].name });
        }
      }

      // Calculate volatility (standard deviation)
      const variance = values.length > 1
        ? values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / (values.length - 1)
        : 0;
      const stdDev = Math.sqrt(variance);

      return {
        chartData: normalizedData,
        stats: {
          total: sum,
          average: avg,
          max,
          min,
          median,
          count: values.length,
          trend,
          changePercent,
          firstValue,
          lastValue,
          peaks: peaks.slice(0, 3), // Top 3 peaks
          valleys: valleys.slice(0, 3), // Top 3 valleys
          stdDev,
          volatility: stdDev > 0 ? (stdDev / avg) * 100 : 0 // Coefficient of variation
        }
      };
    }

    // Handle structured data
    if (data && typeof data === 'object' && (data as any).chartData) {
      const d = data as any;
      return {
        chartData: (d.chartData || []).map((point: any) => ({
          name: String(point.label || point.name || 'Unknown'),
          value: Number(point.value || 0) || 0
        })),
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const index = chartData.findIndex((d: any) => d.name === label);
      
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Value:</span> {formatExactValue(data.value)}
            </p>
            {stats && (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">vs Average:</span> {
                    data.value > stats.average 
                      ? `+${formatExactValue(data.value - stats.average)}`
                      : `-${formatExactValue(stats.average - data.value)}`
                  }
                </p>
                {index > 0 && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Change:</span> {
                      data.value > chartData[index - 1].value
                        ? `+${formatExactValue(data.value - chartData[index - 1].value)}`
                        : `-${formatExactValue(chartData[index - 1].value - data.value)}`
                    }
                  </p>
                )}
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Position:</span> {index + 1} of {chartData.length}
                </p>
              </>
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
      link.download = `line-chart-${new Date().toISOString().split('T')[0]}.png`;
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
          <h4 className="text-lg font-semibold text-slate-800">{title || 'Line Chart'}</h4>
          <p className="text-sm text-slate-600">Time series and trend visualization</p>
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
            <LineChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
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
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ 
                  r: 6, 
                  stroke: "#2563eb", 
                  strokeWidth: 2, 
                  fill: "#ffffff",
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                }}
                name="Values"
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-sm text-slate-500">Average</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.average)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Maximum</div>
              <div className="text-lg font-semibold text-emerald-600">
                {formatExactValue(stats.max)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Minimum</div>
              <div className="text-lg font-semibold text-red-600">
                {formatExactValue(stats.min)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Median</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.median)}
              </div>
            </Card>
          </div>

          {/* Trend Analysis */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {stats.trend === 'up' && <TrendingUp className="h-5 w-5 text-emerald-600 mr-2" />}
                  {stats.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600 mr-2" />}
                  {stats.trend === 'stable' && <Minus className="h-5 w-5 text-slate-600 mr-2" />}
                  <span className="text-sm font-medium text-slate-700">Overall Trend</span>
                </div>
                <span className={`text-sm font-semibold ${
                  stats.trend === 'up' ? 'text-emerald-600' :
                  stats.trend === 'down' ? 'text-red-600' :
                  'text-slate-600'
                }`}>
                  {stats.trend === 'up' ? 'Increasing' :
                   stats.trend === 'down' ? 'Decreasing' :
                   'Stable'}
                </span>
              </div>
              {stats.changePercent !== 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}% change from first to last value
                </div>
              )}
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Volatility</div>
              <div className="text-lg font-semibold text-slate-800">
                {stats.volatility.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Coefficient of Variation
              </div>
            </Card>
          </div>

          {/* Peaks and Valleys */}
          {(stats.peaks.length > 0 || stats.valleys.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {stats.peaks.length > 0 && (
                <Card className="p-4">
                  <h5 className="font-medium text-slate-800 mb-3">Peaks</h5>
                  <div className="space-y-2">
                    {stats.peaks.map((peak: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-slate-700">{peak.name}</span>
                        </div>
                        <span className="text-sm font-medium text-emerald-600">
                          {formatExactValue(peak.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {stats.valleys.length > 0 && (
                <Card className="p-4">
                  <h5 className="font-medium text-slate-800 mb-3">Valleys</h5>
                  <div className="space-y-2">
                    {stats.valleys.map((valley: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-slate-700">{valley.name}</span>
                        </div>
                        <span className="text-sm font-medium text-red-600">
                          {formatExactValue(valley.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* First and Last Values */}
          <Card className="p-4 border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Starting Value</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatExactValue(stats.firstValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Ending Value</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatExactValue(stats.lastValue)}
                </div>
              </div>
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

