import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface XmRChartProps {
  // Accepts either our internal normalized structure or the BE `ChartData.data`
  data: any;
  insights?: string[];
}

export default function XmRChart({ data, insights = [] }: XmRChartProps) {
  // Normalize incoming data to a common shape for rendering
  const { chartData, stats } = useMemo(() => {
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
      const sd = values.length ? Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (values.length || 1)) : 0;
      const ucl = avg + 3 * sd;
      const lcl = avg - 3 * sd;
      return {
        chartData: arr.map((p, i) => ({
          name: (p && (p.x ?? p.label)) ?? String(i + 1),
          value: typeof p === 'number' ? p : (p.y ?? p.value ?? 0),
          average: avg,
          UCL: ucl,
          LCL: lcl,
          isSignal: false
        })),
        stats: {
          centralLine: avg,
          averageMovingRange: 0,
          UCL_Individual: ucl,
          LCL_Individual: lcl,
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
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-medium text-slate-800">{label}</p>
          <p className="text-sm text-slate-600">
            Value: <span className="font-medium">{formatValue(data.value)}</span>
          </p>
          {data.isSignal && (
            <p className="text-sm text-amber-600">⚠️ Special cause detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  const exportChart = () => {
    // In a real app, this would export the chart as an image
    console.log("Export chart functionality would be implemented here");
  };

  const investigateSignal = () => {
    // In a real app, this would open a detailed analysis view
    console.log("Investigate signal functionality would be implemented here");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-800">XmR Chart</h4>
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
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Control Limits */}
              <ReferenceLine 
                y={stats.UCL_Individual} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                label={{ value: "UCL", position: "right" }}
              />
              <ReferenceLine 
                y={stats.centralLine} 
                stroke="#64748b" 
                strokeDasharray="3 3" 
                label={{ value: "Average", position: "right" }}
              />
              <ReferenceLine 
                y={stats.LCL_Individual} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                label={{ value: "LCL", position: "right" }}
              />
              
              {/* Data Line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
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
            {formatValue(stats.centralLine)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-slate-500">UCL</div>
          <div className="text-lg font-semibold text-emerald-600">
            {formatValue(stats.UCL_Individual)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-slate-500">LCL</div>
          <div className="text-lg font-semibold text-red-600">
            {formatValue(stats.LCL_Individual)}
          </div>
        </Card>
      </div>

      {/* Insights and Signals */}
      {(stats.individualSignals.length > 0 || stats.rangeSignals.length > 0) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-medium mb-2">Process Signal Detected</div>
            <div className="space-y-1">
              {insights.map((insight, index) => (
                <div key={index} className="text-sm">{insight}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
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

      {/* Process Statistics */}
      <Card className="p-4">
        <h5 className="font-medium text-slate-800 mb-3">Process Statistics</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Data Points:</span>
            <span className="ml-2 font-medium">{stats.dataPoints}</span>
          </div>
          <div>
            <span className="text-slate-500">Average Moving Range:</span>
            <span className="ml-2 font-medium">{formatValue(stats.averageMovingRange)}</span>
          </div>
          <div>
            <span className="text-slate-500">Valid Ranges:</span>
            <span className="ml-2 font-medium">{stats.validRanges}</span>
          </div>
          <div>
            <span className="text-slate-500">Process Width:</span>
            <span className="ml-2 font-medium">{formatValue(stats.UCL_Individual - stats.LCL_Individual)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
