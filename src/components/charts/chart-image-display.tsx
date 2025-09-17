import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, AlertCircle, Loader2 } from "lucide-react";
import { componentLogger } from "@/lib/logger";
import { chartsApi } from "@/lib/api";
import type { ChartImage } from "@/types/shared";

interface ChartImageDisplayProps {
  images: {
    main_chart: ChartImage;
    summary_chart: ChartImage;
  };
}

export default function ChartImageDisplay({ images }: ChartImageDisplayProps) {
  const { main_chart, summary_chart } = images;

  // Log chart image data for debugging
  componentLogger.render('ChartImageDisplay', { images });


  const renderChartImage = (chart: ChartImage, isMain: boolean = false) => {
    // Handle error state
    if (chart.error) {
      return (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Chart Generation Failed</span>
          </div>
          <p className="text-sm text-destructive/80 mt-1">{chart.error}</p>
        </Card>
      );
    }

    // Handle missing data - check if it's still processing or truly unavailable
    if (!chart.base64_data && !chart.filename) {
      // If there's no error but no data, it might still be processing
      if (!chart.error && chart.title && chart.title !== 'Chart generation failed') {
        return (
          <Card className="p-4 border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating chart image...</span>
            </div>
          </Card>
        );
      }
      
      return (
        <Card className="p-4 border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Chart image not available</span>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4 border-slate-200">
        <div className="space-y-3">
          {/* Chart Title */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">{chart.title}</h4>
            <div className="flex items-center space-x-2">
              {(chart.url || chart.filename) && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <a
                    href={chart.url || chartsApi.getImage(chart.filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View Full Size</span>
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Chart Image */}
          <div className="relative group">
            <img
              src={chart.base64_data 
                ? `data:image/png;base64,${chart.base64_data}` 
                : chartsApi.getImage(chart.filename)
              }
              alt={chart.title}
              className="w-full h-auto rounded-lg border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              style={{ maxWidth: '100%', height: 'auto' }}
              onError={(e) => {
                // Fallback to base64 if filename fails
                if (chart.base64_data && e.currentTarget.src !== `data:image/png;base64,${chart.base64_data}`) {
                  e.currentTarget.src = `data:image/png;base64,${chart.base64_data}`;
                }
              }}
            />
            
            {/* Chart Type Badge */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/95 text-slate-600 border border-slate-200 shadow-sm">
                {chart.type === 'xmr_control_chart' ? 'Control Chart' : 'Summary'}
              </span>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
          </div>

          {/* Chart Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {chart.type === 'xmr_control_chart' ? 'XmR Control Chart' : 'XmR Summary Chart'}
            </div>
            {(chart.url || chart.filename) && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <a
                  href={chart.url || chartsApi.getImage(chart.filename)}
                  download={`${chart.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Chart */}
      {main_chart && (
        <div>
          {renderChartImage(main_chart, true)}
        </div>
      )}

      {/* Summary Chart */}
      {summary_chart && (
        <div>
          {renderChartImage(summary_chart, false)}
        </div>
      )}

      {/* No Images Available */}
      {(!main_chart || main_chart.error) && (!summary_chart || summary_chart.error) && (
        <Card className="p-4 border-slate-200 bg-slate-50">
          <div className="text-center text-slate-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Chart images are not available</p>
            <p className="text-xs text-slate-400 mt-1">
              The chart data is available, but image generation failed or is not enabled.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
