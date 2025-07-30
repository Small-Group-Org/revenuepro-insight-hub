import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { formatCurrencyValue } from './utils';

export interface MetricItem {
  name: string;
  actual: number;
  target: number;
  format: 'currency' | 'percent' | 'number';
}

export interface MetricSection {
  category: string;
  items: MetricItem[];
}

export interface ExportData {
  metrics: MetricSection[];
  period: 'weekly' | 'monthly' | 'yearly';
  selectedDate: Date;
  actualMetrics: Record<string, number>;
  targetData: Record<string, number>;
}

// Format value helper for Excel export
const formatValueForExcel = (value: number, format: string): string => {
  if (format === "currency") {
    return formatCurrencyValue(value);
  }
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return Math.round(value)?.toLocaleString();
};

// Calculate percentage difference
const calculatePercentage = (actual: number, target: number): string => {
  if (target === 0) return 'N/A';
  return `${((actual / target) * 100).toFixed(2)}%`;
};

// Calculate performance indicator
const calculatePerformance = (actual: number, target: number): string => {
  if (target === 0) return 'N/A';
  const percent = ((actual - target) / target) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

export const exportToExcel = (data: ExportData): void => {
  const { metrics, period, selectedDate, actualMetrics, targetData } = data;
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel
  const excelData: any[][] = [];
  
  // Add header information
  excelData.push(['Target vs Actual Comparison Report']);
  excelData.push([]);
  excelData.push(['Period:', period.charAt(0).toUpperCase() + period.slice(1)]);
  excelData.push(['Date:', format(selectedDate, 'MMMM dd, yyyy')]);
  excelData.push([]);
  
  // Add column headers
  excelData.push([
    'Category',
    'Metric',
    'Actual',
    'Target',
    'Progress (%)',
    'Performance (%)'
  ]);
  
  // Add data rows
  metrics.forEach(section => {
    // Add category header
    excelData.push([section.category, '', '', '', '', '']);
    
    // Add metric rows
    section.items.forEach(item => {
      const progress = calculatePercentage(item.actual, item.target);
      const performance = calculatePerformance(item.actual, item.target);
      
      excelData.push([
        '', // Empty category column for sub-items
        item.name,
        formatValueForExcel(item.actual, item.format),
        formatValueForExcel(item.target, item.format),
        progress,
        performance
      ]);
    });
    
    // Add empty row after each section
    excelData.push(['', '', '', '', '', '']);
  });
  
  // Add summary section
  excelData.push(['SUMMARY', '', '', '', '', '']);
  excelData.push(['', '', '', '', '', '']);
  
  // Add key performance indicators
  const summaryMetrics = [
    { name: 'Total Revenue', value: actualMetrics.revenue || 0, format: 'currency' },
    { name: 'Total Leads', value: actualMetrics.leads || 0, format: 'number' },
    { name: 'Total Jobs Booked', value: actualMetrics.sales || 0, format: 'number' },
    { name: 'Total Budget Spent', value: actualMetrics.budgetSpent || 0, format: 'currency' },
    { name: 'Average Job Size', value: actualMetrics.avgJobSize || 0, format: 'currency' },
    { name: 'Appointment Rate', value: actualMetrics.appointmentRate || 0, format: 'percent' },
    { name: 'Show Rate', value: actualMetrics.showRate || 0, format: 'percent' },
    { name: 'Close Rate', value: actualMetrics.closeRate || 0, format: 'percent' },
    { name: 'Lead to Sale', value: actualMetrics.leadToSale || 0, format: 'percent' },
  ];
  
  summaryMetrics.forEach(metric => {
    excelData.push([
      '',
      metric.name,
      formatValueForExcel(metric.value, metric.format),
      '',
      '',
      ''
    ]);
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Category
    { wch: 25 }, // Metric
    { wch: 15 }, // Actual
    { wch: 15 }, // Target
    { wch: 15 }, // Progress
    { wch: 15 }, // Performance
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add styling for headers
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Style the main title
  if (worksheet['A1']) {
    worksheet['A1'].s = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' }
    };
  }
  
  // Style column headers
  for (let col = 0; col <= 5; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 6, c: col });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
        alignment: { horizontal: 'center' }
      };
    }
  }
  
  // Style category headers
  metrics.forEach((section, sectionIndex) => {
    const startRow = 8 + sectionIndex * (section.items.length + 2);
    const cellRef = XLSX.utils.encode_cell({ r: startRow, c: 0 });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true, color: { rgb: "000080" } },
        fill: { fgColor: { rgb: "E6E6FA" } }
      };
    }
  });
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparison Results');
  
  // Generate filename
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const filename = `target-vs-actual-${period}-${dateStr}.xlsx`;
  
  // Save the file
  XLSX.writeFile(workbook, filename);
};

// Alternative function for CSV export if needed
export const exportToCSV = (data: ExportData): void => {
  const { metrics, period, selectedDate } = data;
  
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Add header
  csvContent += 'Target vs Actual Comparison Report\n';
  csvContent += `Period: ${period}\n`;
  csvContent += `Date: ${format(selectedDate, 'MMMM dd, yyyy')}\n\n`;
  
  // Add column headers
  csvContent += 'Category,Metric,Actual,Target,Progress (%),Performance (%)\n';
  
  // Add data
  metrics.forEach(section => {
    csvContent += `${section.category},,,,,\n`;
    
    section.items.forEach(item => {
      const progress = calculatePercentage(item.actual, item.target);
      const performance = calculatePerformance(item.actual, item.target);
      
      csvContent += `,${item.name},${formatValueForExcel(item.actual, item.format)},${formatValueForExcel(item.target, item.format)},${progress},${performance}\n`;
    });
    
    csvContent += ',,,,,\n';
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `target-vs-actual-${period}-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 