# Report View Implementation Plan

## 1. Overview
The Report View displays detailed results of a security header scan, including the security score, detected headers, missing headers, headers leaking information, and provides options for sharing and deleting the report. It is accessible through a unique hash-based URL and plays a critical role in the "scan-and-share" functionality of the application.

## 2. Routing View
- Path: `/#/report/{hash}`
- Parameter: `hash` - 32-character hexadecimal identifier of the report

## 3. Component Structure
```
ReportView
├── Header (reused)
├── ReportHeader
├── ScoreSection
│   └── ScoreGauge
├── HeadersSection
│   └── HeaderTabs
│       ├── HeaderList (Detected)
│       ├── HeaderList (Missing)
│       └── HeaderList (Leaking)
├── SharingSection
├── DeleteSection
│   └── DeleteConfirmationModal
└── Footer (reused)
```

## 4. Component Details

### ReportView
- Description: Main container component that fetches and displays the report data
- Main elements: Container layout with Header, main content sections, and Footer
- Interactions: Initializes data fetching when component mounts or hash parameter changes
- Validation: Validates hash parameter format (32-character hexadecimal)
- Types: Uses `ReportViewModel` for local state
- Props: None (gets hash from route parameters)

### ReportHeader
- Description: Displays the scanned URL, timestamp, and DeleteToken alert (if present)
- Main elements: URL display, formatted date, conditional alert for DeleteToken
- Interactions: None
- Validation: None
- Types: `ReportHeaderProps` containing URL, timestamp, and optional deleteToken
- Props:
  ```typescript
  interface ReportHeaderProps {
    url: string;
    createdAt: number;
    deleteToken?: string;
  }
  ```

### ScoreSection
- Description: Displays the security score with a visual gauge and contextual message
- Main elements: `ScoreGauge` component, descriptive text based on score range
- Interactions: None
- Validation: None
- Types: `ScoreSectionProps` with score value
- Props:
  ```typescript
  interface ScoreSectionProps {
    score: number;
  }
  ```

### ScoreGauge
- Description: Visual circular gauge showing the security score from 0-100
- Main elements: SVG-based circular gauge with color gradients based on score range
- Interactions: None
- Validation: None
- Types: `ScoreGaugeProps` with score value
- Props:
  ```typescript
  interface ScoreGaugeProps {
    score: number;
  }
  ```

### HeadersSection
- Description: Tab interface to navigate between detected, missing, and leaking headers
- Main elements: Tab navigation and content panels showing different header categories
- Interactions: Tab selection, expansion of header details
- Validation: None
- Types: `HeadersSectionProps` with header data
- Props:
  ```typescript
  interface HeadersSectionProps {
    headers: {
      detected: HeaderEntry[];
      missing: HeaderEntry[];
      leaking: HeaderEntry[];
    };
  }
  ```

### HeaderTabs
- Description: Tab navigation component for switching between header categories
- Main elements: Tab buttons with active state indicators
- Interactions: Tab selection event handlers
- Validation: None
- Types: `HeaderTabsProps` with active tab and change handler
- Props:
  ```typescript
  interface HeaderTabsProps {
    activeTab: HeaderTabType;
    onTabChange: (tab: HeaderTabType) => void;
  }
  ```

### HeaderList
- Description: Displays a list of headers with expandable details and educational links
- Main elements: Collapsible panels showing header names, values, and explanations
- Interactions: Expand/collapse panels, click educational links
- Validation: None
- Types: `HeaderListProps` with header entries
- Props:
  ```typescript
  interface HeaderListProps {
    headers: HeaderEntry[];
    type: HeaderTabType;
  }
  ```

### SharingSection
- Description: Provides buttons for sharing the report on social media
- Main elements: LinkedIn and Twitter share buttons
- Interactions: Click to open share dialogs for respective platforms
- Validation: None
- Types: `SharingSectionProps` with report data for sharing
- Props:
  ```typescript
  interface SharingSectionProps {
    url: string;
    score: number;
    hash: string;
    shareImageUrl: string | null;
  }
  ```

### DeleteSection
- Description: Interface for deleting the report, including token input and confirmation
- Main elements: Delete button, token input field, confirmation modal
- Interactions: Open modal, input token, confirm deletion
- Validation: Token format validation (32-character hexadecimal)
- Types: `DeleteSectionProps` with hash for deletion
- Props:
  ```typescript
  interface DeleteSectionProps {
    hash: string;
  }
  ```

### DeleteConfirmationModal
- Description: Modal dialog for confirming report deletion with token input
- Main elements: Modal container, token input, confirmation/cancel buttons
- Interactions: Input token, submit deletion request, cancel deletion
- Validation: Token format validation
- Types: `DeleteConfirmationModalProps` with visibility and event handlers
- Props:
  ```typescript
  interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (token: string) => void;
    errorMessage?: string;
    isSubmitting: boolean;
  }
  ```

## 5. Types

### Enum Types
```typescript
enum HeaderTabType {
  DETECTED = "detected",
  MISSING = "missing",
  LEAKING = "leaking"
}
```

### View Models
```typescript
interface ReportViewModel {
  report: FetchReportResponseDTO | null;
  isLoading: boolean;
  error?: string;
  errorCode?: string;
  activeTab: HeaderTabType;
  isDeleteModalOpen: boolean;
  deleteToken: string;
  isDeleting: boolean;
  deleteError?: string;
}
```

## 6. State Management

### useReportView Custom Hook
```typescript
function useReportView(hash: string) {
  // State for report data, loading, and errors
  const [report, setReport] = useState<FetchReportResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<HeaderTabType>(HeaderTabType.DETECTED);
  
  // Delete functionality state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteToken, setDeleteToken] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  
  // Fetch report data
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setErrorCode(undefined);
    
    try {
      const response = await fetch(`/api/report/${hash}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setErrorCode(err.code || 'UNKNOWN_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [hash]);
  
  // Delete report functionality
  const deleteReport = async (token: string) => {
    setIsDeleting(true);
    setDeleteError(undefined);
    
    try {
      const response = await fetch('/api/report/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, deleteToken: token })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }
      
      // Success - redirect to home
      window.location.href = '/#/';
    } catch (err) {
      setDeleteError(err.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Initialize data fetching
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  return {
    report,
    isLoading,
    error,
    errorCode,
    activeTab,
    setActiveTab,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteToken,
    setDeleteToken,
    isDeleting,
    deleteError,
    deleteReport
  };
}
```

## 7. API Integration

### Fetch Report Data
- Endpoint: GET `/api/report/{hash}`
- Request: URL parameter `hash` (32-character hexadecimal)
- Response: `FetchReportResponseDTO` containing report data
- Error handling:
  - 404: Report not found
  - 400: Invalid hash format
  - 500: Server error

### Delete Report
- Endpoint: POST `/api/report/delete`
- Request Body: `DeleteReportRequestDTO` with hash and deleteToken
- Response: 204 No Content on success
- Error handling:
  - 400: Invalid request format
  - 404: Report not found
  - 403: Invalid delete token
  - 500: Server error

## 8. User Interactions

### Viewing Report
1. User navigates to `/#/report/{hash}`
2. Application fetches report data
3. Displays score, header information, and sharing options

### Navigating Header Tabs
1. User clicks on tab (Detected/Missing/Leaking)
2. Active tab state updates
3. Corresponding header list displays

### Expanding Header Details
1. User clicks on a header item
2. Panel expands to show detailed information
3. Educational links are displayed for further learning

### Sharing Report
1. User clicks on LinkedIn/Twitter share button
2. Share dialog opens with pre-populated content
3. Share image is included when available

### Deleting Report
1. User clicks "Delete Report" button
2. Confirmation modal opens
3. User enters deleteToken
4. On successful deletion, user is redirected to home page
5. On error, error message is displayed

## 9. Conditions and Validation

### Hash Parameter Validation
- Must be a 32-character hexadecimal string
- Validated before API request is made

### Delete Token Validation
- Must be a 32-character hexadecimal string
- Validated before submission to API

### Score-based Messaging
- Score > 70: Congratulatory message
- Score <= 70: Educational message with improvement suggestions

## 10. Error Handling

### Report Not Found
- Display friendly error message
- Provide link to home page for new scan

### Invalid Delete Token
- Display specific error in modal
- Allow user to try again

### API Request Failures
- Display appropriate error messages
- Provide retry options where applicable

### Network Errors
- Detect offline status
- Provide retry mechanism when connection is restored

## 11. Implementation Steps

1. Create basic folder structure and component files
   ```
   src/
   ├── components/
   │   ├── report/
   │   │   ├── ReportView.tsx
   │   │   ├── ReportHeader.tsx
   │   │   ├── ScoreSection.tsx
   │   │   ├── ScoreGauge.tsx
   │   │   ├── HeadersSection.tsx
   │   │   ├── HeaderTabs.tsx
   │   │   ├── HeaderList.tsx
   │   │   ├── SharingSection.tsx
   │   │   ├── DeleteSection.tsx
   │   │   └── DeleteConfirmationModal.tsx
   │   └── ...
   ├── hooks/
   │   └── useReportView.ts
   ├── types/
   │   └── reportTypes.ts
   └── ...
   ```

2. Define necessary TypeScript types and enums

3. Implement `useReportView` custom hook for state management

4. Implement main `ReportView` component with layout and data fetching

5. Implement `ScoreSection` and `ScoreGauge` for score visualization

6. Implement `HeadersSection`, `HeaderTabs`, and `HeaderList` for displaying header information

7. Implement `SharingSection` for social media sharing functionality

8. Implement `DeleteSection` and `DeleteConfirmationModal` for report deletion

9. Update router configuration to include the Report View

10. Add error handling and loading states throughout the view

11. Implement responsive styling using Tailwind CSS

12. Test all user interactions and API integrations

13. Implement final UI improvements and accessibility features
