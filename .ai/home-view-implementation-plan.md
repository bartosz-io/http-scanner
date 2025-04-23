# Home Page View Implementation Plan

## 1. Overview
The Home Page is the entry point for users to the HTTP Scanner application. It allows scanning URLs for HTTP security headers, displays information about how the application works, system statistics, and a list of recent scans. It is a key element of the user interface, providing intuitive access to the main functionality of the application.

## 2. View Routing
The main view will be available at path `/#/` (hash routing) as the application root.

## 3. Component Structure
```
HomePage
├── Header
│   └── NavigationMenu
├── MainContent
│   ├── ScanSection
│   │   ├── ScanForm
│   │   │   ├── URLInput
│   │   │   └── ScanButton
│   │   └── ScanFormFeedback
│   ├── HowItWorksSection
│   │   ├── InfoGraphic
│   │   └── StepsExplanation
│   ├── StatisticsSection
│   │   └── StatCard (multiple)
│   └── RecentScansSection
│       ├── ScansTable
│       │   └── TableRow (multiple)
│       └── SeeAllButton
└── Footer
```

## 4. Component Details

### HomePage
- Component description: Main container for the home page organizing all sections
- Main elements: Sections: ScanSection, HowItWorksSection, StatisticsSection, RecentScansSection
- Supported interactions: None direct (delegated to child components)
- Supported validation: None direct (delegated to child components)
- Types: No specific types
- Props: None

### ScanForm
- Component description: Form for entering URL and initiating scanning
- Main elements: URLInput text field, ScanButton
- Supported interactions: Text input, form submission, error handling
- Supported validation: 
  - URL format validation (HTTP/HTTPS protocol) 
  - Maximum URL length (2048 characters)
  - Check if URL is not empty
- Types: `ScanFormViewModel`, `ScanRequestDTO`
- Props: `onScanSuccess: (response: ScanResponseDTO) => void`

### ScanFormFeedback
- Component description: Displays feedback after scan attempt (success, error, rate limit)
- Main elements: Error messages, loading spinner during submission
- Supported interactions: None
- Supported validation: None
- Types: `ScanFormFeedbackProps`
- Props: `isSubmitting: boolean, error?: string, errorCode?: string`

### HowItWorksSection
- Component description: Informational section explaining how the application works
- Main elements: Infographic, text content with steps
- Supported interactions: None
- Supported validation: None
- Types: No specific types
- Props: None

### StatisticsSection
- Component description: Section displaying system statistics
- Main elements: Stat cards (StatCard)
- Supported interactions: None
- Supported validation: None
- Types: `StatisticsViewModel`
- Props: None

### StatCard
- Component description: Card displaying a single statistic
- Main elements: Title, numeric value, icon, description
- Supported interactions: None
- Supported validation: None
- Types: No specific types
- Props: `title: string, value: number | string, icon?: ReactNode, description?: string, isLoading?: boolean`

### RecentScansSection
- Component description: Section with a table of recent scans
- Main elements: ScansTable, SeeAllButton
- Supported interactions: Click on "See all" button
- Supported validation: None
- Types: `RecentScansViewModel`
- Props: None

### ScansTable
- Component description: Table displaying recent scans (20 entries)
- Main elements: Column headers, table rows (TableRow)
- Supported interactions: Click on table row (redirect to report details)
- Supported validation: None
- Types: `ReportListItemDTO[]`
- Props: `scans: ReportListItemDTO[], isLoading: boolean, error?: string`

### TableRow
- Component description: Single row in the scans table
- Main elements: Data cells (URL, date, score)
- Supported interactions: Click (redirect to report details)
- Supported validation: None
- Types: `ReportListItemDTO`
- Props: `scan: ReportListItemDTO`

## 5. Types

### ScanFormViewModel
```typescript
interface ScanFormViewModel {
  url: string;
  isValid: boolean;
  errorMessage?: string;
  isSubmitting: boolean;
  scanResponse?: ScanResponseDTO;
}
```

### ScanFormFeedbackProps
```typescript
interface ScanFormFeedbackProps {
  isSubmitting: boolean;
  error?: string;
  errorCode?: string; // e.g. "RATE_LIMIT_EXCEEDED", "INVALID_URL", "SCAN_TIMEOUT"
}
```

### StatisticsViewModel
```typescript
interface StatisticsViewModel {
  totalScans: number;
  averageScore: number;
  isLoading: boolean;
  error?: string;
}
```

### RecentScansViewModel
```typescript
interface RecentScansViewModel {
  scans: ReportListItemDTO[];
  isLoading: boolean;
  error?: string;
}
```

## 6. State Management

For this view, 3 main custom hooks will be needed for state management:

### useScanForm
```typescript
const useScanForm = () => {
  const [formState, setFormState] = useState<ScanFormViewModel>({
    url: '',
    isValid: false,
    isSubmitting: false
  });
  
  // Function to validate URL
  const validateUrl = (url: string): boolean => {...}
  
  // Function to submit the form
  const submitScan = async (): Promise<void> => {...}
  
  // Function to reset the form
  const resetForm = (): void => {...}
  
  return { formState, validateUrl, submitScan, resetForm };
}
```

### useStatistics
```typescript
const useStatistics = () => {
  const [stats, setStats] = useState<StatisticsViewModel>({
    totalScans: 0,
    averageScore: 0,
    isLoading: true
  });
  
  // Function to fetch statistics
  const fetchStatistics = async (): Promise<void> => {...}
  
  // Effect to fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);
  
  return { stats, fetchStatistics };
}
```

### useRecentScans
```typescript
const useRecentScans = (limit = 20) => {
  const [recentScans, setRecentScans] = useState<RecentScansViewModel>({
    scans: [],
    isLoading: true
  });
  
  // Function to fetch recent scans
  const fetchRecentScans = async (): Promise<void> => {...}
  
  // Effect to fetch scans on component mount
  useEffect(() => {
    fetchRecentScans();
  }, []);
  
  return { recentScans, fetchRecentScans };
}
```

## 7. API Integration

### Scanning URL
- Endpoint: `POST /scan`
- Method: `scanUrl`
- Request: `ScanRequestDTO` - contains `url` field
- Response: `ScanResponseDTO` - full scan report
- Implementation:
```typescript
const scanUrl = async (url: string): Promise<ScanResponseDTO> => {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.code || 'UNKNOWN_ERROR');
  }
  
  return await response.json();
};
```

### Fetching Statistics
- Endpoint: `GET /admin/stats`
- Method: `fetchStatistics`
- Response: `AdminStatsResponseDTO`
- Implementation:
```typescript
const fetchStatistics = async (): Promise<AdminStatsResponseDTO> => {
  const response = await fetch('/api/admin/stats');
  
  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }
  
  return await response.json();
};
```

### Fetching Recent Scans
- Endpoint: `GET /reports`
- Method: `fetchRecentScans`
- Parameters: `limit`, `cursor`, `sortField`, `sortDirection`
- Response: `ReportsResponseDTO`
- Implementation:
```typescript
const fetchRecentScans = async (
  limit = 20,
  sortField = 'created_at',
  sortDirection = 'desc'
): Promise<ReportsResponseDTO> => {
  const url = new URL('/api/reports', window.location.origin);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sortField', sortField);
  url.searchParams.append('sortDirection', sortDirection);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent scans');
  }
  
  return await response.json();
};
```

## 8. User Interactions

### Entering URL and Scanning
1. User enters URL in the form field
2. Real-time validation checks the format correctness
3. After clicking the "Scan" button:
   - If URL is invalid, a validation message is displayed
   - If URL is valid, the form is submitted
   - While waiting for a response, a spinner is displayed
4. After scan completion:
   - In case of success, user is redirected to the report page
   - In case of error, an appropriate message is displayed (rate limit, timeout, etc.)

### Viewing Recent Scans
1. User sees a table with the last 20 scans
2. Clicking on a table row redirects to the details of that report
3. Clicking the "See all" button redirects to the full list of reports

## 9. Conditions and Validation

### URL Validation
- URL format must comply with HTTP/HTTPS protocol
- URL cannot be empty
- URL cannot exceed 2048 characters
- Implementation:
```typescript
const validateUrl = (url: string): boolean => {
  if (!url.trim()) {
    setFormState(prev => ({
      ...prev,
      isValid: false,
      errorMessage: 'URL cannot be empty'
    }));
    return false;
  }
  
  if (url.length > 2048) {
    setFormState(prev => ({
      ...prev,
      isValid: false,
      errorMessage: 'URL cannot exceed 2048 characters'
    }));
    return false;
  }
  
  try {
    const parsedUrl = new URL(url);
    const isHttpOrHttps = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    
    setFormState(prev => ({
      ...prev,
      isValid: isHttpOrHttps,
      errorMessage: isHttpOrHttps ? undefined : 'URL must use HTTP or HTTPS protocol'
    }));
    
    return isHttpOrHttps;
  } catch (error) {
    setFormState(prev => ({
      ...prev,
      isValid: false,
      errorMessage: 'Invalid URL format'
    }));
    return false;
  }
};
```

### Rate Limit Handling
- API returns "RATE_LIMIT_EXCEEDED" error code when domain was scanned within the last hour
- ScanFormFeedback component displays appropriate message to the user
- Implementation:
```typescript
const renderErrorMessage = (errorCode?: string) => {
  switch (errorCode) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'This domain was recently scanned. Please try again in an hour.';
    case 'INVALID_URL':
      return 'Invalid URL format. Check the address and try again.';
    case 'SCAN_TIMEOUT':
      return 'The response time was exceeded. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};
```

## 10. Error Handling

### Form Errors
- Invalid URL format - display validation message
- Character limit exceeded - display validation message

### API Errors
- Rate limit - display information about previous domain scanning
- Timeout - display information about response time exceeded
- Server error - display general error message with retry option

### Data Fetching Errors
- Statistics fetching error - display placeholders with error information
- Recent scans fetching error - display empty table with error information and retry button

## 11. Implementation Steps

1. Create basic component structure
   - Implement HomePage as container
   - Add sections according to component hierarchy

2. Implement scan form
   - Create ScanForm component with URLInput field and ScanButton
   - Implement useScanForm hook with validation and submission logic
   - Add ScanFormFeedback component for message handling

3. Implement "How it works" section
   - Create HowItWorksSection component with infographic and step description
   - Add static informational content

4. Implement statistics section
   - Create StatisticsSection and StatCard components
   - Implement useStatistics hook with data fetching logic
   - Add loading and error state handling

5. Implement recent scans section
   - Create RecentScansSection with ScansTable and SeeAllButton
   - Implement useRecentScans hook with data fetching logic
   - Add loading and error state handling
   - Implement navigation to report details

6. API integration
   - Implement scanUrl, fetchStatistics, fetchRecentScans functions
   - Add API error handling and user messages

7. Implement responsiveness
   - Adapt layout for mobile devices
   - Optimize table for small screens

8. Testing
   - Unit tests for components and hooks
   - Integration tests for API interactions
   - End-to-end tests for main user flows

9. Performance optimization
   - Memoize components rendered multiple times
   - Implement lazy loading for components not visible initially
   - Optimize API queries

10. Deployment
    - Integrate with existing application routing
    - Publish using CI/CD pipeline
