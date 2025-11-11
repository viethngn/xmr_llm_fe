import { useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";
import { fileLogger } from "@/lib/file-logger";

interface BarChartProps {
  data: any;
  title?: string;
  insights?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
}

export default function BarChartComponent({ data, title, insights = [], xAxisKey = 'name', yAxisKey = 'value' }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Ensure axis keys are valid (not empty strings)
  const effectiveXAxisKey = xAxisKey && xAxisKey.trim() ? xAxisKey.trim() : 'name';
  const effectiveYAxisKey = yAxisKey && yAxisKey.trim() ? yAxisKey.trim() : 'value';
  
  // Normalize and process data
  const { chartData, stats } = useMemo(() => {
    console.log('🔍 BarChart Data Processing:', {
      inputData: data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      isNull: data === null,
      isUndefined: data === undefined,
      hasChartData: !!(data as any)?.chartData,
      hasStatistics: !!(data as any)?.statistics,
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A'
    });
    
    // Log to file
    fileLogger.debug('BAR_CHART', 'Data Processing', {
      inputData: data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: Array.isArray(data) ? data.length : 'N/A'
    });

    if (!data) {
      console.warn('⚠️ BarChart: No data provided');
      return { chartData: [], stats: null };
    }

    // Handle array of data points
    if (Array.isArray(data)) {
      console.log('📊 BarChart: Processing array data, length:', data.length);
      const arr = data as any[];
      if (arr.length === 0) {
        console.warn('⚠️ BarChart: Empty array provided');
        return { chartData: [], stats: null };
      }
      
      console.log('📊 BarChart: Normalizing array data', {
        xAxisKey,
        yAxisKey,
        effectiveXAxisKey,
        effectiveYAxisKey,
        first3Points: arr.slice(0, 3)
      });
      
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
            console.log(`🔍 BarChart: Auto-detected yAxisKey as "${detectedYAxisKey}" from data`);
            fileLogger.info('BAR_CHART', `Auto-detected yAxisKey`, {
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
        
        // Extract value - try multiple possible property names
        let value: number | undefined = undefined;
        
        if (typeof p === 'number') {
          value = p;
        } else if (p && typeof p === 'object') {
          // DEBUG: Log the point structure
          if (i === 0) {
            console.log('🔍 BarChart: First point analysis:', {
              point: p,
              pointType: typeof p,
              isArray: Array.isArray(p),
              keys: Object.keys(p),
              entries: Object.entries(p),
              hasValue: 'value' in p,
              valueDirect: p['value'],
              valueType: typeof p['value'],
              effectiveYAxisKey,
              detectedYAxisKey,
              yAxisKeyValue: p[effectiveYAxisKey],
              detectedYAxisKeyValue: p[detectedYAxisKey],
              yAxisKeyType: typeof p[effectiveYAxisKey]
            });
          }
          
          // Try multiple possible value keys - check if they exist and are not undefined/null
          // Start with the detected/specified yAxisKey, then try common alternatives
          const possibleKeys = [
            detectedYAxisKey,  // Use detected key (or effective if detection didn't work)
            effectiveYAxisKey,  // Fallback to effective key
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
          
          // Step 1: Try the detected/specified yAxisKey first (most important!)
          const keyToTry = detectedYAxisKey !== 'value' ? detectedYAxisKey : effectiveYAxisKey;
          if (keyToTry && p[keyToTry] !== undefined && p[keyToTry] !== null) {
            const candidate = p[keyToTry];
            if (typeof candidate === 'number' && !isNaN(candidate) && isFinite(candidate)) {
              value = candidate;
              if (i < 3) console.log(`✅ BarChart: Step 1 - Found value ${value} using yAxisKey "${keyToTry}"`);
            } else if (typeof candidate === 'string' && candidate.trim()) {
              const parsed = parseFloat(candidate);
              if (!isNaN(parsed) && isFinite(parsed)) {
                value = parsed;
                if (i < 3) console.log(`✅ BarChart: Step 1 - Found value ${value} by parsing yAxisKey "${keyToTry}" = "${candidate}"`);
              }
            }
          }
          
          // Step 2: Try common keys from the predefined list
          if (value === undefined) {
            for (const key of possibleKeys) {
              if (!key || !key.trim()) continue;
              
              // Skip if we already tried this key (detected or effective yAxisKey)
              if (key === detectedYAxisKey || key === effectiveYAxisKey) continue;
              
              // Direct property access
              if (p[key] !== undefined && p[key] !== null) {
                const candidate = p[key];
                
                // Try to convert to number
                if (typeof candidate === 'number') {
                  if (!isNaN(candidate) && isFinite(candidate)) {
                    value = candidate;
                    if (i < 3) {
                      console.log(`✅ BarChart: Found value ${value} using key "${key}" from point ${i}`);
                    }
                    break;
                  }
                } else if (typeof candidate === 'string' && candidate.trim()) {
                  const parsed = parseFloat(candidate);
                  if (!isNaN(parsed) && isFinite(parsed)) {
                    value = parsed;
                    if (i < 3) {
                      console.log(`✅ BarChart: Found value ${value} by parsing "${key}" = "${candidate}" from point ${i}`);
                    }
                    break;
                  }
                }
              }
            }
          }
          
          // Step 3: If still no value, try ALL keys in the object (find first numeric value, excluding xAxisKey)
          if (value === undefined && p && typeof p === 'object') {
            const allKeys = Object.keys(p);
            // Detect the actual x-axis key from the data (it's likely a string key like "month", "date", etc.)
            const actualXAxisKey = allKeys.find(k => {
              const val = p[k];
              // X-axis keys are typically strings (dates, categories, labels)
              return typeof val === 'string' && (k === effectiveXAxisKey || k === 'name' || k === 'label' || k === 'x' || k === 'month' || k === 'date' || k === 'category');
            });
            
            if (i < 3) {
              console.log(`🔍 BarChart: Step 3 - Trying all keys. All keys:`, allKeys, `Actual x-axis key detected:`, actualXAxisKey);
            }
            
            for (const key of allKeys) {
              // Skip the x-axis keys (both effective and actual)
              if (key === effectiveXAxisKey || key === actualXAxisKey || key === 'name' || key === 'label' || key === 'x' || key === 'month' || key === 'date' || key === 'category') {
                if (i < 3) console.log(`⏭️ BarChart: Step 3 - Skipping x-axis key "${key}"`);
                continue;
              }
              
              const candidate = p[key];
              if (candidate === undefined || candidate === null) continue;
              
              // Try to convert to number
              if (typeof candidate === 'number') {
                if (!isNaN(candidate) && isFinite(candidate)) {
                  value = candidate;
                  if (i < 3) {
                    console.log(`✅ BarChart: Step 3 - Found value ${value} using key "${key}"`);
                  }
                  fileLogger.debug('BAR_CHART', `Step 3 - Found value using key "${key}"`, {
                    pointIndex: i,
                    key,
                    value,
                    allKeys
                  });
                  break;
                }
              } else if (typeof candidate === 'string' && candidate.trim()) {
                const parsed = parseFloat(candidate);
                if (!isNaN(parsed) && isFinite(parsed)) {
                  value = parsed;
                  if (i < 3) {
                    console.log(`✅ BarChart: Step 3 - Found value ${value} by parsing key "${key}" = "${candidate}"`);
                  }
                  fileLogger.debug('BAR_CHART', `Step 3 - Found value by parsing key "${key}"`, {
                    pointIndex: i,
                    key,
                    originalValue: candidate,
                    parsedValue: value,
                    allKeys
                  });
                  break;
                }
              }
            }
          }
          
          // If still no value found, log all available properties for debugging
          if (value === undefined && p && typeof p === 'object') {
            console.error(`❌ BarChart: Could not extract value from point ${i}:`, {
              point: p,
              pointStringified: JSON.stringify(p),
              allKeys: Object.keys(p),
              allEntries: Object.entries(p).map(([k, v]) => `${k}: ${v} (${typeof v})`),
              triedKeys: possibleKeys,
              yAxisKey: effectiveYAxisKey,
              directValueAccess: p['value'],
              directValueType: typeof p['value']
            });
            
            // Log to file
            fileLogger.error('BAR_CHART', `Could not extract value from point ${i}`, {
              point: p,
              allKeys: Object.keys(p),
              allEntries: Object.entries(p),
              triedKeys: possibleKeys,
              yAxisKey: effectiveYAxisKey,
              directValueAccess: p['value']
            });
          }
        }
        
        // Convert to number, defaulting to 0 only if value is truly undefined/null
        // IMPORTANT: Don't use || 0 here because 0 is a valid value!
        let finalValue = 0;
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            finalValue = numValue;
          } else {
            console.warn(`⚠️ BarChart: Invalid number value for point ${i}:`, value);
          }
        } else {
          console.warn(`⚠️ BarChart: No value found for point ${i}, defaulting to 0`);
        }
        
        const normalized = {
          name: String(name),
          value: finalValue
        };
        
        if (i < 5) {
          console.log(`📊 BarChart: Normalized point ${i}:`, { 
            original: p, 
            originalKeys: p && typeof p === 'object' ? Object.keys(p) : 'N/A',
            originalValues: p && typeof p === 'object' ? Object.entries(p).map(([k, v]) => `${k}=${v}(${typeof v})`).join(', ') : 'N/A',
            xAxisKey,
            yAxisKey,
            effectiveXAxisKey,
            effectiveYAxisKey,
            hasValueKey: p && typeof p === 'object' ? p.hasOwnProperty('value') : false,
            valueProperty: p && typeof p === 'object' ? p['value'] : 'N/A',
            valuePropertyType: p && typeof p === 'object' ? typeof p['value'] : 'N/A',
            extractedName: name,
            extractedValue: value,
            finalValue,
            normalized 
          });
          
          // Log to file
          fileLogger.debug('BAR_CHART', `Normalized point ${i}`, {
            original: p,
            originalKeys: p && typeof p === 'object' ? Object.keys(p) : 'N/A',
            originalValues: p && typeof p === 'object' ? Object.entries(p).map(([k, v]) => `${k}=${v}(${typeof v})`).join(', ') : 'N/A',
            xAxisKey,
            yAxisKey,
            effectiveXAxisKey,
            effectiveYAxisKey,
            hasValueKey: p && typeof p === 'object' ? p.hasOwnProperty('value') : false,
            valueProperty: p && typeof p === 'object' ? p['value'] : 'N/A',
            extractedValue: value,
            finalValue,
            normalized
          });
        }
        return normalized;
      });
      
      console.log('📊 BarChart: Normalized data sample (first 3):', normalizedData.slice(0, 3));

      // Calculate statistics
      const values = normalizedData.map(d => d.value).filter(v => !isNaN(v) && v !== null && v !== undefined);
      console.log('📊 BarChart: Extracted values:', { 
        count: values.length, 
        sample: values.slice(0, 5),
        allValues: values,
        hasNonZero: values.some(v => v !== 0),
        zeroCount: values.filter(v => v === 0).length
      });
      
      // Check if all values are zero
      if (values.every(v => v === 0)) {
        console.warn('⚠️ BarChart: All values are zero! This might indicate a data extraction issue.');
        console.warn('📊 BarChart: Normalized data sample:', normalizedData.slice(0, 5));
        console.warn('📊 BarChart: Original data sample:', arr.slice(0, 5));
      }
      
      if (values.length === 0) {
        console.warn('⚠️ BarChart: No valid values found after normalization');
        return { chartData: [], stats: null };
      }
      
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length ? sum / values.length : 0;
      const max = values.length ? Math.max(...values) : 0;
      const min = values.length ? Math.min(...values) : 0;
      
      console.log('📊 BarChart: Calculated stats:', { sum, avg, max, min, count: values.length });
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted.length 
        ? sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

      // Calculate trend (comparing first half vs second half)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (values.length >= 4) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (changePercent > 5) trend = 'up';
        else if (changePercent < -5) trend = 'down';
        else trend = 'stable';
      }

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
          topValues: normalizedData
            .map((d, i) => ({ name: d.name, value: d.value, index: i }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
        }
      };
    }

    // Handle structured data
    if (data && typeof data === 'object' && (data as any).chartData) {
      console.log('📊 BarChart: Processing structured data with chartData property');
      const d = data as any;
      const processed = {
        chartData: (d.chartData || []).map((point: any) => ({
          name: String(point.label || point.name || 'Unknown'),
          value: Number(point.value || 0) || 0
        })),
        stats: d.statistics || null
      };
      console.log('📊 BarChart: Processed structured data:', { 
        chartDataLength: processed.chartData.length,
        hasStats: !!processed.stats 
      });
      return processed;
    }

    console.warn('⚠️ BarChart: Data format not recognized:', {
      dataType: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
    });
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
      const percentage = stats && stats.total > 0 
        ? ((data.value / stats.total) * 100).toFixed(1)
        : '0';
      
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Value:</span> {formatExactValue(data.value)}
            </p>
            {stats && stats.total > 0 && (
              <p className="text-sm text-slate-600">
                <span className="font-medium">Percentage:</span> {percentage}%
              </p>
            )}
            {stats && (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">vs Average:</span> {
                    data.value > stats.average 
                      ? `+${formatExactValue(data.value - stats.average)}`
                      : `-${formatExactValue(stats.average - data.value)}`
                  }
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Rank:</span> {
                    chartData
                      .map((d: any) => d.value)
                      .sort((a: number, b: number) => b - a)
                      .indexOf(data.value) + 1
                  } of {chartData.length}
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
      link.download = `bar-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  // Show message if no data
  if (!chartData || chartData.length === 0) {
    console.error('❌ BarChart: No chart data available after processing', {
      originalData: data,
      chartData,
      stats
    });
    return (
      <Card className="p-4 border-amber-200 bg-amber-50">
        <div className="text-center text-amber-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">No Data Available</p>
          <p className="text-xs mt-1">Please ensure your data contains valid values for charting</p>
          <details className="mt-2 text-xs text-left max-w-md mx-auto">
            <summary className="cursor-pointer text-amber-700">Debug Info</summary>
            <pre className="mt-1 p-2 bg-amber-100 rounded text-xs overflow-auto">
              {JSON.stringify({ dataType: typeof data, isArray: Array.isArray(data), dataLength: Array.isArray(data) ? data.length : 'N/A' }, null, 2)}
            </pre>
          </details>
        </div>
      </Card>
    );
  }
  
  console.log('✅ BarChart: Successfully processed data', {
    chartDataLength: chartData.length,
    hasStats: !!stats,
    firstFewPoints: chartData.slice(0, 3)
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-800">{title || 'Bar Chart'}</h4>
          <p className="text-sm text-slate-600">Categorical data visualization</p>
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
            <BarChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}
                  </span>
                )}
              />
              <Bar 
                dataKey="value" 
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                stroke="#1d4ed8"
                strokeWidth={1}
                name="Values"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.total)}
              </div>
            </Card>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3">
              <div className="text-sm text-slate-500">Median</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatExactValue(stats.median)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-slate-500">Data Points</div>
              <div className="text-lg font-semibold text-slate-800">
                {stats.count}
              </div>
            </Card>
          </div>

          {/* Trend Indicator */}
          {stats.trend && (
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {stats.trend === 'up' && <TrendingUp className="h-5 w-5 text-emerald-600 mr-2" />}
                  {stats.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600 mr-2" />}
                  {stats.trend === 'stable' && <Minus className="h-5 w-5 text-slate-600 mr-2" />}
                  <span className="text-sm font-medium text-slate-700">Trend Analysis</span>
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
            </Card>
          )}

          {/* Top Values */}
          {stats.topValues && stats.topValues.length > 0 && (
            <Card className="p-4">
              <h5 className="font-medium text-slate-800 mb-3">Top 3 Values</h5>
              <div className="space-y-2">
                {stats.topValues.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {formatExactValue(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
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

