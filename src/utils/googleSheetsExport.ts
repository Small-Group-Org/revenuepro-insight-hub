import { format } from 'date-fns';
import { 
  initializeGoogleAPI, 
  authenticateUser, 
  createNewGoogleSheet, 
  updateGoogleSheet, 
  formatGoogleSheet 
} from './googleSheetsConfig';
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

// Format value helper for Google Sheets export
const formatValueForSheets = (value: number, format: string): string => {
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

// Function to create a new Google Sheet and populate it with data
export const exportToGoogleSheets = async (data: ExportData): Promise<string> => {
  const { metrics, period, selectedDate, actualMetrics, targetData } = data;
  
  try {
    // Check if Google API credentials are configured
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || !process.env.REACT_APP_GOOGLE_API_KEY) {
      // Fallback to CSV export that can be imported to Google Sheets
      console.log('Google API credentials not configured, using CSV fallback');
      return await exportToCSVAndOpenGoogleSheets(data);
    }
    
    // Initialize Google API
    await initializeGoogleAPI();
    
    // Authenticate user
    const isAuthenticated = await authenticateUser();
    if (!isAuthenticated) {
      throw new Error('Authentication failed');
    }
    
    // Prepare data for Google Sheets
    const sheetData = prepareSheetData(data);
    
    // Create a new Google Sheet
    const title = `Target vs Actual - ${period.charAt(0).toUpperCase() + period.slice(1)} - ${format(selectedDate, 'yyyy-MM-dd')}`;
    const spreadsheetId = await createNewGoogleSheet(title);
    
    if (!spreadsheetId) {
      throw new Error('Failed to create Google Sheet');
    }
    
    // Update the sheet with data
    await updateGoogleSheet(spreadsheetId, 'A1', sheetData);
    
    // Format the sheet
    await formatGoogleSheet(spreadsheetId);
    
    // Return the sheet URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return sheetUrl;
  } catch (error) {
    console.error('Google Sheets export failed:', error);
    // Fallback to CSV method
    console.log('Falling back to CSV export method');
    return await exportToCSVAndOpenGoogleSheets(data);
  }
};

// Prepare data for Google Sheets
const prepareSheetData = (data: ExportData): any[][] => {
  const { metrics, period, selectedDate, actualMetrics } = data;
  
  const sheetData: any[][] = [];
  
  // Add header information
  sheetData.push(['Target vs Actual Comparison Report']);
  sheetData.push([]);
  sheetData.push(['Period:', period.charAt(0).toUpperCase() + period.slice(1)]);
  sheetData.push(['Date:', format(selectedDate, 'MMMM dd, yyyy')]);
  sheetData.push([]);
  
  // Add column headers
  sheetData.push([
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
    sheetData.push([section.category, '', '', '', '', '']);
    
    // Add metric rows
    section.items.forEach(item => {
      const progress = calculatePercentage(item.actual, item.target);
      const performance = calculatePerformance(item.actual, item.target);
      
      sheetData.push([
        '', // Empty category column for sub-items
        item.name,
        formatValueForSheets(item.actual, item.format),
        formatValueForSheets(item.target, item.format),
        progress,
        performance
      ]);
    });
    
    // Add empty row after each section
    sheetData.push(['', '', '', '', '', '']);
  });
  
  // Add summary section
  sheetData.push(['SUMMARY', '', '', '', '', '']);
  sheetData.push(['', '', '', '', '', '']);
  
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
    sheetData.push([
      '',
      metric.name,
      formatValueForSheets(metric.value, metric.format),
      '',
      '',
      ''
    ]);
  });
  
  return sheetData;
};

// Function to create Google Sheet using Google Sheets API
const createGoogleSheet = async (data: any[][], period: string, selectedDate: Date): Promise<any> => {
  // For now, we'll use a simplified approach that creates a CSV and opens it in Google Sheets
  // In a production environment, you would need to set up Google OAuth and use the Google Sheets API
  
  // Create CSV content
  let csvContent = '';
  
  data.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  // Create a blob and download it
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `target-vs-actual-${period}-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // For now, return a mock response
  // In a real implementation, this would return the actual Google Sheet ID
  return {
    spreadsheetId: 'mock-sheet-id',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-sheet-id'
  };
};

// Function to export CSV and open Google Sheets for import
export const exportToCSVAndOpenGoogleSheets = async (data: ExportData): Promise<string> => {
  const { metrics, period, selectedDate, actualMetrics } = data;
  
  // Prepare data for Google Sheets
  const sheetData = prepareSheetData(data);
  
  // Convert to CSV format
  let csvContent = '';
  sheetData.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  // Create a blob and download it
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `target-vs-actual-${period}-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // Encode the CSV data for Google Sheets import
  const encodedData = encodeURIComponent(csvContent);
  
  // Create Google Sheets URL with data
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/create?usp=data_import&t=csv&data=${encodedData}`;
  
  // Open in new tab
  window.open(googleSheetsUrl, '_blank');
  
  return googleSheetsUrl;
};

// Alternative function that opens Google Sheets with data
export const openInGoogleSheets = (data: ExportData): void => {
  const { metrics, period, selectedDate, actualMetrics } = data;
  
  // Prepare data for Google Sheets
  const sheetData = prepareSheetData(data);
  
  // Convert to CSV format
  let csvContent = '';
  sheetData.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  // Encode the CSV data
  const encodedData = encodeURIComponent(csvContent);
  
  // Create Google Sheets URL with data
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/create?usp=data_import&t=csv&data=${encodedData}`;
  
  // Open in new tab
  window.open(googleSheetsUrl, '_blank');
};

// Function to export as CSV (fallback option)
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
      
      csvContent += `,${item.name},${formatValueForSheets(item.actual, item.format)},${formatValueForSheets(item.target, item.format)},${progress},${performance}\n`;
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