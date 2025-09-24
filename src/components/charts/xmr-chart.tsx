import { useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";

interface XmRChartProps {
  // Accepts either our internal normalized structure or the BE `ChartData.data`
  data: any;
  title?: string;
  insights?: string[];
}

export default function XmRChart({ data, title, insights = [] }: XmRChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Normalize incoming data to a common shape for rendering
  const { chartData, stats } = useMemo(() => {
    console.log('🔍 XmR Chart Data Processing:', {
      inputData: data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      hasChartData: !!(data as any)?.chartData,
      hasStatistics: !!(data as any)?.statistics
    });
    // Case 1: already in expected shape: { chartData: [...], statistics: {...} }
    if (data && (data as any).chartData && (data as any).statistics) {
      const d = data as any;
      return {
        chartData: d.chartData.map((point: any) => ({
          name: point.label,
          value: point.individual,
          average: point.centralLine,
          UCL: point.UCL,
          LCL: point.LCL,
          isSignal: point.isIndividualSignal
        })),
        stats: d.statistics
      };
    }

    // Case 2: BE `ChartData.data`: array of points like { x, y } or any[]
    if (Array.isArray(data)) {
      const arr = data as any[];
      const values = arr.map((p) => (typeof p === 'number' ? p : (p.y ?? p.value ?? 0)));
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      
      // Calculate moving ranges for proper XmR control limits
      const movingRanges = [];
      for (let i = 1; i < values.length; i++) {
        movingRanges.push(Math.abs(values[i] - values[i - 1]));
      }
      const avgMovingRange = movingRanges.length ? movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length : 0;
      
      // XmR Control Limits (as per Xmrit manual)
      const ucl = avg + (2.66 * avgMovingRange);
      const lcl = avg - (2.66 * avgMovingRange);
      
      // Calculate quartile lines for Rule 2
      const upperQuartile = avg + (2.66 * avgMovingRange) / 2;
      const lowerQuartile = avg - (2.66 * avgMovingRange) / 2;
      
      console.log('🔍 XmR Calculations:', {
        values,
        avg,
        movingRanges,
        avgMovingRange,
        ucl,
        lcl,
        upperQuartile,
        lowerQuartile,
        multiplier: 2.66
      });
      
      // Apply Xmrit detection rules
      const chartDataWithSignals = arr.map((p, i) => {
        const value = typeof p === 'number' ? p : (p.y ?? p.value ?? 0);
        
        // Rule 1: Process Limit Rule - Points outside UCL/LCL
        const isRule1Signal = value > ucl || value < lcl;
        
        // Rule 2: Quartile Limit Rule - 3 out of 4 consecutive points nearer to limits
        let isRule2Signal = false;
        if (i >= 3 && values.length >= 4) { // Need at least 4 points to check rule 2
          try {
            const recent4 = values.slice(Math.max(0, i - 3), i + 1);
            if (recent4.length >= 4) {
              const nearerToLimits = recent4.map(v => {
                const distToCenter = Math.abs(v - avg);
                const distToUCL = Math.abs(v - ucl);
                const distToLCL = Math.abs(v - lcl);
                return distToUCL < distToCenter || distToLCL < distToCenter;
              });
              const countNearerToLimits = nearerToLimits.filter(Boolean).length;
              isRule2Signal = countNearerToLimits >= 3;
            }
          } catch (e) {
            console.warn('Rule 2 calculation error:', e);
            isRule2Signal = false;
          }
        }
        
        // Rule 3: Runs of Eight - 8 consecutive points on one side of center line
        let isRule3Signal = false;
        if (i >= 7 && values.length >= 8) { // Need at least 8 points to check rule 3
          try {
            const recent8 = values.slice(Math.max(0, i - 7), i + 1);
            if (recent8.length >= 8) {
              const allAboveCenter = recent8.every(v => v > avg);
              const allBelowCenter = recent8.every(v => v < avg);
              isRule3Signal = allAboveCenter || allBelowCenter;
            }
          } catch (e) {
            console.warn('Rule 3 calculation error:', e);
            isRule3Signal = false;
          }
        }
        
        const isSignal = isRule1Signal || isRule2Signal || isRule3Signal;
        const signalType = isRule1Signal ? 'rule1' : isRule2Signal ? 'rule2' : isRule3Signal ? 'rule3' : null;
        
        // Debug logging for signal detection
        if (isSignal) {
          console.log(`🔍 Signal detected at point ${i + 1}:`, {
            value,
            avg,
            ucl,
            lcl,
            isRule1Signal,
            isRule2Signal,
            isRule3Signal,
            signalType
          });
        }
        
        return {
          name: (p && (p.x ?? p.label)) ?? String(i + 1),
          value,
          average: avg,
          UCL: ucl,
          LCL: lcl,
          upperQuartile,
          lowerQuartile,
          isSignal,
          signalType,
          isRule1Signal,
          isRule2Signal,
          isRule3Signal
        };
      });
      
      return {
        chartData: chartDataWithSignals,
        stats: {
          centralLine: avg,
          averageMovingRange: avgMovingRange,
          UCL_Individual: ucl,
          LCL_Individual: lcl,
          UCL_MovingRange: 3.27 * avgMovingRange,
          LCL_MovingRange: 0,
          individualSignals: chartDataWithSignals.filter(d => d.isRule1Signal).map(d => d.name),
          rangeSignals: [],
          dataPoints: values.length,
          validRanges: Math.max(0, values.length - 1),
          invalidRanges: 0,
          rule1Signals: chartDataWithSignals.filter(d => d.isRule1Signal).length,
          rule2Signals: chartDataWithSignals.filter(d => d.isRule2Signal).length,
          rule3Signals: chartDataWithSignals.filter(d => d.isRule3Signal).length,
          totalSignals: chartDataWithSignals.filter(d => d.isSignal).length
        }
      };
    }

    // Fallback: empty
    return {
      chartData: [],
      stats: {
        centralLine: 0,
        averageMovingRange: 0,
        UCL_Individual: 0,
        LCL_Individual: 0,
        UCL_MovingRange: 0,
        LCL_MovingRange: 0,
        individualSignals: [],
        rangeSignals: [],
        dataPoints: 0,
        validRanges: 0,
        invalidRanges: 0
      }
    };
  }, [data]);

  // Debug the final statistics
  console.log('🔍 XmR Chart Final Statistics:', {
    stats,
    UCL: stats?.UCL_Individual,
    LCL: stats?.LCL_Individual,
    centralLine: stats?.centralLine,
    hasValidLimits: !!(stats?.UCL_Individual && stats?.LCL_Individual && stats?.centralLine),
    signals: {
      rule1: stats?.rule1Signals,
      rule2: stats?.rule2Signals,
      rule3: stats?.rule3Signals,
      total: stats?.totalSignals
    },
    chartDataLength: chartData?.length,
    chartDataSample: chartData?.slice(0, 3)
  });

  // Safety check: ensure we have valid control limits and data
  if (!stats || !stats.UCL_Individual || !stats.LCL_Individual || !stats.centralLine) {
    console.warn('⚠️ Missing control limits, using fallback values');
    const fallbackStats = {
      centralLine: 0,
      averageMovingRange: 0,
      UCL_Individual: 0,
      LCL_Individual: 0,
      UCL_MovingRange: 0,
      LCL_MovingRange: 0,
      individualSignals: [],
      rangeSignals: [],
      dataPoints: 0,
      validRanges: 0,
      invalidRanges: 0,
      rule1Signals: 0,
      rule2Signals: 0,
      rule3Signals: 0,
      totalSignals: 0
    };
    return { chartData: [], stats: fallbackStats };
  }

  // Safety check: ensure we have valid chart data
  if (!chartData || chartData.length === 0) {
    console.warn('⚠️ No chart data available');
    return { chartData: [], stats };
  }

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
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Value:</span> {formatExactValue(data.value)}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Average:</span> {formatExactValue(data.average)}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">UCL:</span> {formatExactValue(data.UCL)}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">LCL:</span> {formatExactValue(data.LCL)}
            </p>
            {data.isSignal && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-medium text-amber-800">⚠️ Special Cause Detected</p>
                {data.isRule1Signal && (
                  <p className="text-xs text-amber-700">Rule 1: Outside control limits</p>
                )}
                {data.isRule2Signal && (
                  <p className="text-xs text-amber-700">Rule 2: 3 of 4 points nearer to limits</p>
                )}
                {data.isRule3Signal && (
                  <p className="text-xs text-amber-700">Rule 3: 8 consecutive points on one side</p>
                )}
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
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `xmr-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  const investigateSignal = () => {
    // In a real app, this would open a detailed analysis view
    console.log("Investigate signal functionality would be implemented here");
  };

  // Add error boundary for rendering
  try {
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
          <h4 className="text-lg font-semibold text-slate-800">{title || 'XmR Chart'}</h4>
          <p className="text-sm text-slate-600">Individual values with control limits</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportChart}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {stats.individualSignals.length > 0 && (
            <Button variant="default" size="sm" onClick={investigateSignal}>
              <Search className="w-4 h-4 mr-2" />
              Investigate
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        {(!stats || !stats.UCL_Individual || !stats.LCL_Individual || !stats.centralLine) && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-sm text-amber-800">
                Control limits are being calculated. Please ensure your data contains valid values.
              </span>
            </div>
          </div>
        )}
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
                domain={['dataMin - 50000', 'dataMax + 50000']}
                tickCount={8}
                allowDecimals={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '3 3' }}
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
              
              {/* Signal Legend */}
              <div className="absolute top-12 right-4 bg-white p-2 rounded shadow-sm border text-xs">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Rule 1: Outside Limits</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Rule 2/3: Quartile/Runs</span>
                  </div>
                </div>
              </div>
              
              {/* Control Limits - Following Xmrit Manual */}
              <ReferenceLine 
                y={stats.UCL_Individual} 
                stroke="#ef4444" 
                strokeWidth={3}
                strokeDasharray="8 4" 
                label={{ 
                  value: `UCL (${formatExactValue(stats.UCL_Individual)})`, 
                  position: "right", 
                  style: { fill: '#ef4444', fontWeight: 'bold', fontSize: '12px' } 
                }}
              />
              <ReferenceLine 
                y={stats.centralLine} 
                stroke="#ef4444" 
                strokeWidth={3}
                strokeDasharray="4 2" 
                label={{ 
                  value: `Average (${formatExactValue(stats.centralLine)})`, 
                  position: "right", 
                  style: { fill: '#ef4444', fontWeight: 'bold', fontSize: '12px' } 
                }}
              />
              <ReferenceLine 
                y={stats.LCL_Individual} 
                stroke="#ef4444" 
                strokeWidth={3}
                strokeDasharray="8 4" 
                label={{ 
                  value: `LCL (${formatExactValue(stats.LCL_Individual)})`, 
                  position: "right", 
                  style: { fill: '#ef4444', fontWeight: 'bold', fontSize: '12px' } 
                }}
              />
              
              {/* Quartile Lines (as per Xmrit manual) */}
              <ReferenceLine 
                y={stats.centralLine + (stats.UCL_Individual - stats.centralLine) / 2} 
                stroke="#f59e0b" 
                strokeWidth={1}
                strokeDasharray="2 2" 
                label={{ value: "Upper Quartile", position: "right", style: { fill: '#f59e0b', fontSize: '10px' } }}
              />
              <ReferenceLine 
                y={stats.centralLine - (stats.centralLine - stats.LCL_Individual) / 2} 
                stroke="#f59e0b" 
                strokeWidth={1}
                strokeDasharray="2 2" 
                label={{ value: "Lower Quartile", position: "right", style: { fill: '#f59e0b', fontSize: '10px' } }}
              />
              
              {/* Data Line - Basic rendering for now */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ 
                  r: 6, 
                  stroke: "#2563eb", 
                  strokeWidth: 2, 
                  fill: "#ffffff",
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                }}
                name="Values"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-3">
          <div className="text-sm text-slate-500">Central Line</div>
          <div className="text-lg font-semibold text-slate-800">
            {formatExactValue(stats.centralLine)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-slate-500">UCL</div>
          <div className="text-lg font-semibold text-emerald-600">
            {formatExactValue(stats.UCL_Individual)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-slate-500">LCL</div>
          <div className="text-lg font-semibold text-red-600">
            {formatExactValue(stats.LCL_Individual)}
          </div>
        </Card>
      </div>

      {/* Signal Detection Summary */}
      {(stats.totalSignals > 0) && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <h5 className="font-medium text-amber-800">Process Signals Detected</h5>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-amber-700">
                Rule 1 (Outside Limits): {stats.rule1Signals} points
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-amber-700">
                Rule 2 (Quartile): {stats.rule2Signals} points
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-amber-700">
                Rule 3 (Runs of 8): {stats.rule3Signals} points
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
              <span className="text-amber-700 font-medium">
                Total Signals: {stats.totalSignals} points
              </span>
            </div>
          </div>
          
          {/* Show which specific points have signals */}
          <div className="mt-3 pt-3 border-t border-amber-200">
            <div className="text-sm text-amber-700 mb-2">Signal Points:</div>
            <div className="flex flex-wrap gap-2">
              {chartData.map((point, index) => {
                if (!point.isSignal) return null;
                
                let color = "bg-blue-500";
                let ruleText = "";
                if (point.isRule1Signal) {
                  color = "bg-red-500";
                  ruleText = "R1";
                } else if (point.isRule2Signal) {
                  color = "bg-yellow-500";
                  ruleText = "R2";
                } else if (point.isRule3Signal) {
                  color = "bg-yellow-500";
                  ruleText = "R3";
                }
                
                return (
                  <div key={index} className={`${color} text-white text-xs px-2 py-1 rounded`}>
                    {point.name} ({ruleText})
                  </div>
                );
              })}
            </div>
          </div>
          
          {insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="space-y-1">
                {insights.map((insight, index) => (
                  <div key={index} className="text-sm text-amber-700">{insight}</div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Individual Chart Signal Points */}
      {stats.individualSignals.length > 0 && (
        <Card className="p-4">
          <h5 className="font-medium text-slate-800 mb-3">Individual Chart Signals</h5>
          <div className="space-y-2">
            {stats.individualSignals.map((signal, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <Badge variant={signal.type === 'high' ? 'destructive' : 'secondary'}>
                    {signal.type === 'high' ? 'High' : 'Low'}
                  </Badge>
                  <span className="text-sm text-slate-700">
                    Point {signal.index + 1}: {chartData[signal.index]?.name || 'Unknown'}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-800">
                  {formatValue(signal.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Moving Range Signal Points */}
      {stats.rangeSignals.length > 0 && (
        <Card className="p-4">
          <h5 className="font-medium text-slate-800 mb-3">Moving Range Signals</h5>
          <div className="space-y-2">
            {stats.rangeSignals.map((signal, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <Badge variant="destructive">Range</Badge>
                  <span className="text-sm text-slate-700">
                    Range {signal.index}: Excessive variation detected
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-800">
                  {formatValue(signal.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
    );
  } catch (error) {
    console.error('XmR Chart rendering error:', error);
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Chart Rendering Error</p>
          <p className="text-xs mt-1">Something went wrong while rendering the chart</p>
          <details className="mt-2 text-xs text-left">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-auto">
              {error instanceof Error ? error.message : 'Unknown error'}
            </pre>
          </details>
        </div>
      </Card>
    );
  }
}
