# UI Architecture for HTTPScanner.com

## 1. Overview of UI Structure

HTTPScanner.com is a "scan-and-share" web application built with React 19, TypeScript 5, Tailwind CSS 4, and shadcn/ui components. The application follows a hash routing pattern (`/#/route`) and consists of four main views: Home Page with scan interface, Report View for displaying scan results, Reports List Page for browsing existing reports, and an Admin Dashboard for system statistics. The UI is designed to be responsive, accessible, and security-focused while maintaining a clean, minimalist aesthetic.

## 2. View List

### 2.1 Home Page
- **Path**: `/#/` (root)
- **Main Purpose**: Entry point for users to scan URLs and understand the application's purpose
- **Key Information**:
  - URL scanning form
  - "How it works" explanation with text and infographics
  - System statistics (total scans, average score)
  - Recent scans table (20 entries)
- **Key Components**:
  - URL input form with validation
  - Scan button (primary CTA)
  - "How it works" section with infographics
  - Statistics cards
  - Recent scans table
  - "See all recent scans" button
- **UX, Accessibility & Security Considerations**:
  - Prominent positioning of scan form
  - Clear validation messages for URL input
  - Accessible form with appropriate ARIA attributes
  - URL validation before submission

### 2.2 Report View
- **Path**: `/#/report/{hash}`
- **Main Purpose**: Display detailed scan results and provide sharing options
- **Key Information**:
  - Scanned URL and timestamp
  - Security score (0-100)
  - Detected security headers
  - Missing security headers
  - Headers leaking information
  - DeleteToken (first view only)
- **Key Components**:
  - Score gauge/meter
  - Tab navigation (detected/missing/leaking headers)
  - Expandable header information panels
  - Social media sharing buttons
  - Delete report button and confirmation modal
  - DeleteToken banner (first view)
  - Educational links for headers
- **UX, Accessibility & Security Considerations**:
  - Color-coded tabs for different header types
  - Expandable details for each header
  - Clear instructions for DeleteToken preservation
  - Accessible tab interface with keyboard navigation
  - Different messaging based on score (congratulatory for >70, educational for <70)

### 2.3 Reports List Page
- **Path**: `/#/reports`
- **Main Purpose**: Browse all public reports
- **Key Information**:
  - List of reports with URLs and scores
  - Pagination controls
- **Key Components**:
  - Reports table with clickable rows
  - Pagination UI
- **UX, Accessibility & Security Considerations**:
  - Interactive rows with hover states
  - Keyboard navigation for table rows
  - Color-coded score indicators
  - Responsive table design for mobile

### 2.4 Admin Dashboard
- **Path**: `/#/admin`
- **Main Purpose**: Provide system statistics to administrators
- **Key Information**:
  - Scans per day
  - Median scan time
  - DELETE operations and success rate
  - Timeout errors
- **Key Components**:
  - Statistics tables
  - Date range selectors (optional)
- **UX, Accessibility & Security Considerations**:
  - Protected by Cloudflare Access authentication
  - Accessible tables with appropriate headers
  - Clear data presentation

### 2.5 Error Views

#### 2.5.1 404 Page
- **Path**: Fallback for invalid routes
- **Main Purpose**: Inform users about non-existent content
- **Key Components**:
  - Simple error message
  - Link to home page

#### 2.5.2 Rate Limit Notice
- **Path**: Inline component, not a separate route
- **Main Purpose**: Inform users about rate limiting
- **Key Components**:
  - Inline error message
  - Information about when next scan will be available

#### 2.5.3 Scan Timeout
- **Path**: Inline component, not a separate route
- **Main Purpose**: Inform users about scan timeout
- **Key Components**:
  - Inline error message
  - Option to try again

## 3. User Journey Map

### 3.1 Primary User Journey: Scanning and Sharing
1. User arrives at Home Page
2. User reads "How it works" section (optional)
3. User enters URL in scan form and submits
4. System displays loading spinner during scan
5. On completion, user is redirected to Report View
6. User views scan results across different tabs
7. If score > 70:
   - User receives congratulatory message
   - User is encouraged to share results
8. If score < 70:
   - User receives educational guidance
   - User is directed to resources for improving security headers
9. User may share the report on social media
10. User may note the DeleteToken for future reference
11. User may return to home page to scan another site

### 3.2 Report Management Journey
1. User accesses a previously generated report
2. User decides to delete the report
3. User clicks Delete button
4. System displays confirmation modal with DeleteToken input
5. User enters DeleteToken
6. System confirms deletion or shows error
7. If successful, user is redirected to home page

### 3.3 Report Browsing Journey
1. User views recent scans on Home Page
2. User clicks "See all recent scans" button
3. User is directed to Reports List Page
4. User browses paginated list of reports
5. User clicks on a report row
6. User is directed to the Report View for that report

## 4. Navigation Structure and Layout

### 4.1 Global Navigation
- **Fixed Top Bar Header** present on all pages containing:
  - Application logo/name (left side, links to home)
  - Navigation links (center):
    - Home (scan interface)
    - Reports (all reports view)
  - No user account functionality as per requirements

### 4.2 Page Layouts

#### 4.2.1 Home Page Layout
- Fixed header
- Vertical sections:
  1. Hero section with scan form (center-aligned)
  2. "How it works" section
  3. Statistics cards (horizontal row)
  4. Recent scans table with header
  5. "See all" button
- Footer

#### 4.2.2 Report View Layout
- Fixed header
- Report container:
  1. Basic information section (URL, timestamp, score)
  2. Score visualization (gauge/meter)
  3. Tab navigation (detected/missing/leaking)
  4. Tab content area with expandable items
  5. Sharing options
  6. Delete button
- DeleteToken banner (if first view)
- Contextual messaging based on score
- Footer

#### 4.2.3 Reports List Layout
- Fixed header
- Page title
- Reports table
- Pagination controls
- Footer

#### 4.2.4 Admin Dashboard Layout
- Fixed header
- Authentication gate
- Statistics tables
- Footer

## 5. Key Components

### 5.1 URL Scan Form
- URL input field with validation
- Scan button
- Loading state (spinner)
- Inline error message area

### 5.2 Score Gauge/Meter
- Circular gauge displaying 0-100 score
- Color-coded based on score value:
  - Red: 0-39
  - Yellow: 40-69
  - Green: 70-100
- Numerical value displayed in center

### 5.3 Header Information Panel
- Expandable/collapsible container
- Header name and status
- Brief description
- Expandable section with:
  - Detailed explanation
  - Example implementation
  - Link to educational resource

### 5.4 Tab Navigation
- Horizontal tab bar
- Three tabs with distinct colors:
  - Detected headers (green)
  - Missing headers (yellow)
  - Leaking headers (red)
- Accessible keyboard navigation

### 5.5 Recent Scans Table
- Simple table with:
  - URL column
  - Score column (color-coded)
  - Clickable rows

### 5.6 DeleteToken Banner
- Inline banner with important styling
- Clear message about token preservation
- Dismissible

### 5.7 Share Options
- Social media buttons (LinkedIn, Twitter)
- Copy URL button

### 5.8 Delete Confirmation Modal
- Warning message
- DeleteToken input field
- Cancel button
- Confirm button
- Error message area

### 5.9 Statistics Cards
- Card container
- Metric value (prominently displayed)
- Metric label