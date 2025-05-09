# API Endpoint Implementation Plan: GET `/report/{hash}`

## 1. Endpoint Overview
This endpoint serves to retrieve a previously generated report based on its unique identifier (hash). It is a key element of the report sharing functionality, allowing users to access scanning results through direct links.

## 2. Request Details
- HTTP Method: **GET**
- URL Structure: `/report/{hash}`
- Parameters:
  - Required: `hash` (32-character hexadecimal report identifier)
  - Optional: none
- Request Body: none (GET method)

## 3. Types Used
- **FetchReportResponseDTO**: Response type containing report data (defined in `src/types.ts`)
- **Report**: Domain entity representing a report (defined in `worker/entities/Report.ts`)
- **ReportRepository**: Repository interface for report operations
- **FetchReportUseCase**: Use case for retrieving a report
- **ReportController**: Controller handling report-related requests

## 4. Response Details
- Success (200 OK):
  ```json
  {
    "hash": "32-character hexadecimal identifier",
    "url": "normalized URL that was scanned",
    "created_at": 1650000000, // Unix timestamp
    "score": 75, // Security score (0-100)
    "headers": {
      "detected": [...], // Detected security headers
      "missing": [...], // Missing security headers
      "leaking": [...] // Headers revealing information
    },
    "share_image_url": "https://cdn.httpscanner.com/images/abc123.png" // or null
  }
  ```
- Error (404 Not Found):
  ```json
  {
    "error": "Report not found",
    "code": "NOT_FOUND"
  }
  ```

## 5. Data Flow
1. HTTP request arrives at the `/report/{hash}` endpoint
2. Controller extracts the `hash` parameter from the URL
3. Controller validates the format of the `hash` parameter
4. Controller passes the request to the `FetchReportUseCase`
5. Use case calls the `findByHash` method from `ReportRepository`
6. Repository executes a query to the D1 database
7. Repository maps the query result to a `Report` domain object
8. Use case returns the `Report` object to the controller
9. Controller uses `ReportMapper` to transform the `Report` object into a DTO
10. Controller returns an HTTP response with the appropriate status and data

## 6. Security Considerations
- Validation of the `hash` parameter - checking if it is exactly a 32-character hexadecimal string
- No disclosure of sensitive data - `deleteToken` is not returned in the response
- No authentication - the endpoint is publicly accessible but only reveals safe data
- CORS headers - ensuring the response can be read by browsers from different domains

## 7. Error Handling
- **404 Not Found**: When a report with the given hash does not exist or has been deleted
- **400 Bad Request**: When the format of the `hash` parameter is invalid
- **500 Internal Server Error**: When an unexpected error occurs during request processing

## 8. Performance Considerations
- Indexing the `hash` column in the `reports` table for fast lookups
- Caching responses at the Cloudflare Workers level for frequently visited reports
- Minimizing response size by grouping headers into categories

## 9. Implementation Steps

1. **Extend the ReportRepository interface**
   - Add method `findByHash(hash: string): Promise<Report | null>`

2. **Implement findByHash method in D1ReportRepository**
   - SQL query to the D1 database
   - Mapping results to the Report domain object

3. **Create a new FetchReportUseCase**
   - Implement report retrieval logic
   - Handle the case when a report does not exist

4. **Extend ReportMapper**
   - Add `toFetchReportResponseDTO` method (similar to existing `toScanResponseDTO`)

5. **Create ReportController**
   - Implement `handleFetchReport` method
   - Validate `hash` parameter
   - Map the response

6. **Register the new endpoint in the main worker/index.ts file**
   - Add handler for GET `/report/:hash` route
   - Configure dependencies

7. **Testing**
   - Unit tests for new components
   - Integration tests for the entire flow
   - Performance tests for high-load scenarios

8. **Documentation**
   - Update API documentation
   - Add usage examples
