import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DataTableProps {
  data: any[];
  maxRows?: number;
}

export default function DataTable({ data, maxRows = 10 }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    // Try to parse as numbers for proper numeric sorting
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });

  const displayData = showAll ? sortedData : sortedData.slice(0, maxRows);
  const hasMoreRows = data.length > maxRows;

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400">—</span>;
    }

    // Format numbers that look like currency or percentages
    if (typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      
      // Currency formatting for large numbers
      if (numValue >= 1000 && column.toLowerCase().includes('revenue')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      }
      
      // Percentage formatting
      if (column.toLowerCase().includes('growth') || column.toLowerCase().includes('change')) {
        const isPositive = numValue >= 0;
        return (
          <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{numValue}%
          </span>
        );
      }
      
      // Regular number formatting
      if (numValue >= 1000) {
        return numValue.toLocaleString();
      }
    }

    return String(value);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((column) => (
                <TableHead key={column}>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium text-left"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      {getSortIcon(column)}
                    </div>
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={index} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <TableCell key={column} className="text-sm">
                    {formatCellValue(row[column], column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMoreRows && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing {displayData.length} of {data.length} rows
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        </div>
      )}
    </div>
  );
}
