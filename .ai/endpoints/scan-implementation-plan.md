# API Endpoint Implementation Plan: POST /scan

## 1. Endpoint Overview

The `/scan` endpoint enables a complete scan of a public URL to check its HTTP security headers and returns a complete report in the same response. The scanning is performed synchronously, which means the client receives a ready report immediately, without the need for polling. The endpoint analyzes HTTP headers, evaluates their security, and generates a numerical score representing the overall security level of the site.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/scan`
- **Parameters**:
  - **Required**: No URL parameters
  - **Optional**: No URL parameters
- **Request Body**:
  ```json
  {
    "url": "https://example.com"
  }
  ```
  - `url` (string): Full HTTP/HTTPS URL (maximum 2048 characters)

## 3. Types Used

```typescript
// Existing types from src/types.ts
import { ScanRequestDTO, ScanResponseDTO, PublicReportDTO, HeaderEntry, Report } from "../types";

// Additional types needed for implementation
interface ScanCommandModel {
  url: string; // Normalized URL
}

interface HeaderAnalysisResult {
  detected: HeaderEntry[];
  missing: HeaderEntry[];
  leaking: HeaderEntry[];
  score: number;
}

interface ScanResult {
  hash: string;
  url: string;
  created_at: number;
  score: number;
  headers: HeaderEntry[];
  deleteToken: string;
  share_image_key: string | null;
}
```

## 4. Response Details

### Successful Response (200 OK)

```json
{
  "hash": "ab12...ef", // 32-character hexadecimal identifier
  "url": "https://example.com", // Normalized URL
  "created_at": 1713369600, // Unix epoch (seconds)
  "score": 87, // Security score (0-100)
  "headers": {
    "detected": [...], // Detected headers
    "missing": [...], // Missing headers
    "leaking": [...] // Headers revealing information
  },
  "share_image_url": "https://cdn.cloudflare.r2/.../ab12ef.png" // URL to the image
}
```

### Errors

- **400 Bad Request**: Invalid or unsupported URL (non-HTTP/HTTPS)
  ```json
  { 
    "error": "Invalid URL format or protocol not supported",
    "code": "INVALID_URL"
  }
  ```

- **429 Too Many Requests**: Too many scans of the same domain within the last minute
  ```json
  { 
    "error": "Rate limit exceeded: This domain was scanned in the last minute",
    "code": "RATE_LIMIT_EXCEEDED" 
  }
  ```

- **504 Gateway Timeout**: Scanning exceeded 45 seconds (3 attempts × 15 seconds)
  ```json
  { 
    "error": "Scan timed out after 45 seconds",
    "code": "SCAN_TIMEOUT" 
  }
  ```

## 5. Data Flow

1. **Input Validation**: 
   - Check if the URL is a valid HTTP/HTTPS format and does not exceed 2048 characters
   - Check if the domain has not been scanned within the last hour (rate-limit)

2. **Processing**:
   - URL normalization (removing tracking parameters, standardizing format)
   - Performing HTTP HEAD requests (with fallback to GET) to the provided URL
   - Analysis of response headers and security assessment
   - Generating a score based on the `weights.json` file
   - Identification of leaking information based on `headers-leak.json`

3. **Report Generation**:
   - Generating a unique 32-character hexadecimal identifier (hash)
   - Generating a 32-character deletion token (deleteToken)
   - Creating a shareable image (PNG) and saving it in Cloudflare KV/R2
   - Saving the results in the `reports` table in the D1 database

4. **Returning the Response**:
   - Transforming report data to the ScanResponseDTO format
   - Returning the full report in the HTTP response

## 6. Security Considerations

1. **Input Data Validation**:
   - Strict URL validation using regular expressions and length limitation
   - Rejecting non-standard protocols (only HTTP and HTTPS)
   - Blocking URLs leading to internal networks (localhost, private addresses)

2. **Protection Against Attacks**:
   - Implementing rate limiting (1 scan/domain/hour) using Cloudflare WAF
   - Setting timeouts for HTTP requests (15 seconds × 3 attempts) to prevent resource exhaustion
   - Sanitizing all output data before placing it in the JSON response

## 7. Error Handling

1. **Invalid Input Data**:
   - Code: 400 Bad Request
   - Causes: Invalid URL format, unsupported protocol, maximum length exceeded

2. **Scan Limit Exceeded**:
   - Code: 429 Too Many Requests
   - Causes: The same domain was scanned within the last hour
   - Implementation: Using Cloudflare mechanisms to track and enforce limits

3. **Scan Timeout**:
   - Code: 504 Gateway Timeout
   - Causes: Scanning exceeded 45 seconds (3 attempts × 15 seconds)
   - Handling: Interrupting the scan after the time limit and properly terminating the process

4. **Internal Errors**:
   - Code: 500 Internal Server Error
   - Causes: Database problems, errors in image generation, unforeseen exceptions
   - Logging: Detailed logging to Logflare through Cloudflare Logpush

## 8. Performance Considerations

1. **HTTP Optimization**:
   - Preferring HEAD requests over GET when possible
   - Implementing delays (backoff) for multiple attempts
   - Setting an aggressive timeout (15 seconds) for each attempt

2. **Parallel Processing**:
   - Parallel generation of the shareable image during header analysis
   - Optimized saving to the D1 database, using prepared queries

3. **Caching**:
   - Implementing a cache for frequently used resources (weights.json, headers-leak.json)
   - Setting cache-control headers for images (30 days)

## 9. Implementation Stages

1. **Project Configuration and Structure**:
   - Creating a directory structure according to Clean Architecture principles
   - Configuring Cloudflare Worker with appropriate bindings to D1 and KV/R2
   - Creating layers: entities, usecases, interfaces, frameworks/drivers

2. **Domain Layer Implementation**:
   - Creating interfaces (ports) for data repositories, scanning services, and image generation
   - Implementing domain models and business logic for header analysis
   - Implementing score calculation based on weights

3. **Infrastructure Layer**:
   - Implementing the D1 database adapter for CRUD operations on reports
   - Implementing the HTTP header analysis service using Fetch API
   - Implementing the KV/R2 service for storing and retrieving images

4. **API Controller Implementation**:
   - Creating the `/scan` endpoint with POST request handling
   - Implementing input data validation
   - Integrating business logic with the infrastructure layer

5. **Error Handling and Monitoring**:
   - Implementing central error handling with appropriate mapping to HTTP status codes
   - Configuring logging to Logflare with appropriate detail levels

6. **Testing**:
   - Implementing unit tests for each layer
   - Implementing integration tests for the entire endpoint
   - Performance and load testing to determine timeout limits and throughput

7. **Deployment**:
   - Configuring CI/CD in GitHub Actions with automatic tests and deployment
   - Gradual deployment with performance and error monitoring
   - Final deployment with Cloudflare WAF configuration for rate limits
