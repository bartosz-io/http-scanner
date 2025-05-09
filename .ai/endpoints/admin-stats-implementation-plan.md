# API Endpoint Implementation Plan: GET /admin/stats

## 1. Endpoint Overview
The `/admin/stats` endpoint serves to provide administrators with statistics about the HTTP Scanner system's operation. It offers aggregated data on the number of scans performed, unique domains, and timeout errors. The endpoint is protected by Cloudflare Access, ensuring that only authorized administrators can access this data.

## 2. Request Details
- **HTTP Method**: GET
- **URL Structure**: `/admin/stats`
- **Query Parameters**:
  - **Optional**:
    - `from` (integer): Starting timestamp in Unix epoch seconds format
    - `to` (integer): Ending timestamp in Unix epoch seconds format
- **Headers**:
  - Standard Cloudflare Access authentication headers (automatically added by Cloudflare)

## 3. Types Used

```typescript
// DTO for stats endpoint response
export interface AdminStatsResponseDTO {
  /** Total number of scans performed in the selected period */
  total_scans: number;
  /** Number of unique domains scanned in the selected period */
  unique_domains: number;
  /** Number of timeout errors in the selected period */
  timeout_errors: number;
}

// Query model for the stats use case
export interface FetchStatsQueryModel {
  /** Starting timestamp (optional) */
  from?: number;
  /** Ending timestamp (optional) */
  to?: number;
}
```

## 4. Response Details
- **Success (200 OK)**:
  ```json
  {
    "total_scans": 1234,
    "unique_domains": 987,
    "timeout_errors": 5
  }
  ```
- **Authentication Error (401 Unauthorized)**:
  ```json
  {
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
  ```

## 5. Data Flow
1. **Access Validation**:
   - Cloudflare Access verifies that the request comes from an authorized administrator
   - If not, a 401 Unauthorized error is returned

2. **Parameter Validation**:
   - Check if the `from` and `to` parameters (if provided) are valid integers
   - Verify that `from` is earlier than `to`
   - If parameters are not provided, default values are used (e.g., last 30 days)

3. **Data Retrieval**:
   - Execute queries to the D1 database to retrieve aggregated statistics
   - Query for the total number of scans in the given period
   - Query for the number of unique domains in the given period
   - Query for the number of timeout errors in the given period

4. **Response Formatting**:
   - Prepare the response object according to AdminStatsResponseDTO
   - Return the response with a 200 OK status code

## 6. Security Considerations
1. **Authentication and Authorization**:
   - The endpoint is protected by Cloudflare Access, ensuring that only authorized administrators have access
   - Verification of the Cloudflare Access JWT token in middleware

2. **Input Data Validation**:
   - The `from` and `to` parameters must be integers
   - The `from` parameter must be earlier than `to`
   - Implementation of time limits for queries (e.g., maximum 1 year of data)

3. **Attack Protection**:
   - Implementation of rate limiting for the endpoint
   - Logging of all access attempts to the endpoint

## 7. Error Handling
- **401 Unauthorized**: No authorization by Cloudflare Access
- **400 Bad Request**: Invalid query parameters (e.g., `from` > `to`)
- **500 Internal Server Error**: Error while retrieving data from the database

## 8. Performance Considerations
1. **Query Optimization**:
   - Use of indexes on the `created_at` column in the `reports` table
   - Use of aggregating queries instead of retrieving all records
   - Implementation of result caching for frequently used date ranges

2. **Query Limits**:
   - Limiting the maximum date range to a reasonable value (e.g., 1 year)
   - Implementation of pagination for very large data sets

## 9. Implementation Steps

1. **Create Interfaces and Types**:
   - Define `AdminStatsResponseDTO` and `FetchStatsQueryModel` in the `types.ts` file

2. **Implement Repository Interface**:
   - Create `StatsRepository` with the `fetchStats(from?: number, to?: number)` method
   - Implement `D1StatsRepository` using the D1 database

3. **Implement Use Case**:
   - Create `FetchStatsUseCase` responsible for business logic
   - Implement parameter validation and data retrieval from the repository

4. **Implement Controller**:
   - Create `AdminStatsController` to handle HTTP requests
   - Implement the `handleFetchStats` method to handle GET requests

5. **Register Endpoint in Main Worker File**:
   - Add a new route in the Hono application
   - Implement Cloudflare Access authentication middleware

6. **Implement Dependency Factory**:
   - Extend `DependencyFactory` with the `createAdminStatsController` method

7. **Testing**:
   - Create unit tests for the use case and controller
   - Create integration tests for the entire endpoint
   - Manual testing using tools such as curl or Postman

8. **Documentation**:
   - Update API documentation with the new endpoint
   - Add usage examples for administrators
