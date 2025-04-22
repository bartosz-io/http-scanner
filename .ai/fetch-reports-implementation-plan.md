# API Endpoint Implementation Plan: GET `/reports`

## 1. Endpoint Overview
The GET `/reports` endpoint serves to retrieve a paginated list of scan reports. This is a public endpoint that allows users to browse scan history without authentication. The endpoint supports sorting results by creation date or security score and uses cursor-based pagination for efficient navigation through large datasets.

## 2. Request Details
- HTTP Method: **GET**
- URL Structure: `/reports`
- Parameters:
  - Optional:
    - `limit` (integer between 20-100, default 20): number of reports to retrieve
    - `cursor` (string): opaque identifier for pagination, obtained from previous request
    - `sort` (string): field to sort by, allowed values: `created_at` or `score` (prefix `-` for descending sort, e.g. `-created_at`)
- Request Body: none (GET method)

## 3. Types Used

```typescript
// New DTO types to be defined in src/types.ts

/** Minimal report list item */
export type ReportListItemDTO = Pick<
  Report,
  'hash' | 'url' | 'created_at' | 'score'
>;

/** GET /reports - paginated result set */
export interface ReportsResponseDTO {
  items: ReportListItemDTO[];
  next?: string;  // opaque cursor for next page
}

// New query model for the use case
export interface FetchReportsQueryModel {
  limit: number;
  cursor?: string;
  sortField: 'created_at' | 'score';
  sortDirection: 'asc' | 'desc';
}
```

## 4. Response Details
- Success (200 OK):
  ```json
  {
    "items": [
      {
        "hash": "32-character hexadecimal identifier",
        "url": "normalized URL that was scanned",
        "created_at": 1650000000,
        "score": 75
      },
      // ... more items
    ],
    "next": "opaque_cursor_value"  // optional, only if more pages exist
  }
  ```
- Error (400 Bad Request):
  ```json
  {
    "error": "Invalid query parameters",
    "code": "INVALID_PARAMETERS"
  }
  ```

## 5. Data Flow
1. HTTP request arrives at the `/reports` endpoint
2. Controller extracts query parameters (`limit`, `cursor`, `sort`)
3. Controller validates query parameters:
   - `limit` must be an integer between 20-100
   - `sort` must be one of the allowed fields with an optional `-` prefix
   - `cursor` is optional and will be verified by the repository
4. Controller processes the `sort` parameter into `sortField` and `sortDirection`
5. Controller passes parameters to the `FetchReportsUseCase`
6. Use case calls the `findPaginated` method from `ReportRepository`
7. Repository decodes the `cursor` (if it exists) into appropriate offset values
8. Repository executes a query to the D1 database with appropriate sorting parameters and limit
9. Repository maps query results to `Report` domain objects
10. Repository generates a new `cursor` for the next page (if it exists)
11. Use case returns the list of `Report` objects along with the cursor to the controller
12. Controller uses `ReportMapper` to transform `Report` objects to DTOs
13. Controller returns an HTTP response with appropriate status and data

## 6. Security Considerations
- Query parameter validation to prevent SQL injection attacks
- Cursor-based pagination instead of offset for better performance and security
- Opaque cursor (base64 encoded) to hide internal implementation details
- No exposure of sensitive data - only basic report information is returned
- No authentication - endpoint is publicly accessible according to the new access model

## 7. Error Handling
- **400 Bad Request**: When query parameters are invalid (e.g., `limit` out of range)
- **500 Internal Server Error**: When an unexpected error occurs during request processing

## 8. Performance Considerations
- Indexing columns used for sorting (`created_at`, `score`) in the `reports` table
- Cursor-based pagination for efficient browsing of large datasets
- Limiting returned fields to the minimum required for the list (without full header data)
- Possibility of caching responses at the Cloudflare Workers level for frequently used parameters
- Using prepared SQL queries for better performance and security

## 9. Implementation Steps

1. **Extend the ReportRepository interface**
   ```typescript
   // worker/interfaces/repositories/ReportRepository.ts
   export interface ReportRepository {
     // ... existing methods
     
     /**
      * Find a paginated list of reports
      * @param limit Maximum number of reports to retrieve
      * @param cursor Optional pagination cursor
      * @param sortField Field to sort by
      * @param sortDirection Sort direction
      * @returns List of reports and cursor to next page (if exists)
      */
     findPaginated(limit: number, cursor?: string, sortField: 'created_at' | 'score', sortDirection: 'asc' | 'desc'): Promise<{
       reports: Report[];
       nextCursor?: string;
     }>;
   }
   ```

2. **Implement findPaginated method in D1ReportRepository**
   ```typescript
   // worker/impl/repositories/D1ReportRepository.ts
   async findPaginated(limit: number, cursor?: string, sortField: 'created_at' | 'score', sortDirection: 'asc' | 'desc'): Promise<{
     reports: Report[];
     nextCursor?: string;
   }> {
     // Parameter validation
     if (limit < 20 || limit > 100) {
       limit = 20; // Default limit
     }
     
     // Decode cursor (if exists)
     let cursorValues: { field: string; value: number | string } | null = null;
     if (cursor) {
       try {
         cursorValues = JSON.parse(atob(cursor));
       } catch (error) {
         // Ignore invalid cursor and start from beginning
       }
     }
     
     // Build SQL query
     let query = `
       SELECT hash, url, created_at, score
       FROM reports
     `;
     
     const params: any[] = [];
     
     // Add WHERE condition for cursor
     if (cursorValues) {
       if (sortDirection === 'asc') {
         query += ` WHERE ${sortField} > ?`;
       } else {
         query += ` WHERE ${sortField} < ?`;
       }
       params.push(cursorValues.value);
     }
     
     // Add sorting
     query += ` ORDER BY ${sortField} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
     
     // Add limit + 1 to check if next page exists
     query += ` LIMIT ?`;
     params.push(limit + 1);
     
     // Execute query
     const results = await this.db.prepare(query)
       .bind(...params)
       .all<ReportRow>();
     
     if (!results.success) {
       throw new Error('DATABASE_ERROR');
     }
     
     // Check if next page exists
     const hasNextPage = results.results.length > limit;
     const reportRows = hasNextPage ? results.results.slice(0, limit) : results.results;
     
     // Map results to domain objects
     const reports = reportRows.map(row => {
       return Report.create({
         hash: row.hash,
         url: row.url,
         created_at: row.created_at,
         score: row.score,
         headers: [], // Empty because we don't need full header data in the list
         deleteToken: '', // Empty because we don't need this in the list
         share_image_key: null // Empty because we don't need this in the list
       });
     });
     
     // Generate cursor for next page
     let nextCursor: string | undefined;
     if (hasNextPage && reportRows.length > 0) {
       const lastItem = reportRows[reportRows.length - 1];
       const cursorData = {
         field: sortField,
         value: lastItem[sortField]
       };
       nextCursor = btoa(JSON.stringify(cursorData));
     }
     
     return {
       reports,
       nextCursor
     };
   }
   ```

3. **Create new FetchReportsUseCase**
   ```typescript
   // worker/usecases/FetchReportsUseCase.ts
   import { Report } from '../entities/Report';
   import { ReportRepository } from '../interfaces/repositories/ReportRepository';
   import { FetchReportsQueryModel } from '../../src/types';
   
   /**
    * Use case for fetching a paginated list of reports
    * Following clean architecture principles by keeping business logic separate from infrastructure
    */
   export class FetchReportsUseCase {
     constructor(
       private readonly reportRepository: ReportRepository
     ) {}
   
     /**
      * Execute the use case to fetch a paginated list of reports
      * @param queryModel Query model containing pagination and sorting parameters
      * @returns List of reports and cursor to next page (if exists)
      */
     async execute(queryModel: FetchReportsQueryModel): Promise<{
       reports: Report[];
       nextCursor?: string;
     }> {
       // Validate query parameters
       const limit = Math.min(Math.max(queryModel.limit, 20), 100);
       
       // Execute query to repository
       return await this.reportRepository.findPaginated(
         limit,
         queryModel.cursor,
         queryModel.sortField,
         queryModel.sortDirection
       );
     }
   }
   ```

4. **Extend ReportMapper**
   ```typescript
   // worker/impl/mappers/ReportMapper.ts
   // Add new method to existing ReportMapper class
   
   /**
    * Maps a list of Report domain objects to ReportsResponseDTO
    * @param reports List of Report domain objects
    * @param nextCursor Cursor to next page (if exists)
    */
   static toReportsResponseDTO(reports: Report[], nextCursor?: string): ReportsResponseDTO {
     return {
       items: reports.map(report => ({
         hash: report.hash,
         url: report.url,
         created_at: report.created_at,
         score: report.score
       })),
       next: nextCursor
     };
   }
   ```

5. **Create ReportsController**
   ```typescript
   // worker/impl/controllers/ReportsController.ts
   import { Context } from 'hono';
   import { ReportsResponseDTO, FetchReportsQueryModel } from '../../../src/types';
   import { FetchReportsUseCase } from '../../usecases/FetchReportsUseCase';
   import { ReportMapper } from '../mappers/ReportMapper';
   
   /**
    * Controller for handling paginated reports list endpoint
    * Following clean architecture principles by keeping HTTP handling separate from business logic
    */
   export class ReportsController {
     constructor(
       private readonly fetchReportsUseCase: FetchReportsUseCase
     ) {}
   
     /**
      * Handle GET /reports request
      * @param c Hono context
      * @returns HTTP response with paginated reports list
      */
     async handleFetchReports(c: Context): Promise<Response> {
       try {
         // Get and validate query parameters
         const limitParam = c.req.query('limit');
         const cursor = c.req.query('cursor');
         const sort = c.req.query('sort') || 'created_at';
         
         // Parse limit
         let limit = 20; // Default limit
         if (limitParam) {
           const parsedLimit = parseInt(limitParam, 10);
           if (isNaN(parsedLimit) || parsedLimit < 20 || parsedLimit > 100) {
             return c.json({ error: 'Invalid limit parameter', code: 'INVALID_PARAMETERS' }, 400);
           }
           limit = parsedLimit;
         }
         
         // Parse sorting
         let sortField: 'created_at' | 'score' = 'created_at';
         let sortDirection: 'asc' | 'desc' = 'desc';
         
         if (sort.startsWith('-')) {
           const field = sort.substring(1);
           if (field !== 'created_at' && field !== 'score') {
             return c.json({ error: 'Invalid sort parameter', code: 'INVALID_PARAMETERS' }, 400);
           }
           sortField = field as 'created_at' | 'score';
           sortDirection = 'desc';
         } else {
           if (sort !== 'created_at' && sort !== 'score') {
             return c.json({ error: 'Invalid sort parameter', code: 'INVALID_PARAMETERS' }, 400);
           }
           sortField = sort as 'created_at' | 'score';
           sortDirection = 'asc';
         }
         
         // Create query model
         const queryModel: FetchReportsQueryModel = {
           limit,
           cursor,
           sortField,
           sortDirection
         };
         
         // Execute use case
         const { reports, nextCursor } = await this.fetchReportsUseCase.execute(queryModel);
         
         // Map results to DTO
         const responseDTO = ReportMapper.toReportsResponseDTO(reports, nextCursor);
         
         // Return response
         return c.json<ReportsResponseDTO>(responseDTO, 200);
       } catch (error) {
         console.error('Error fetching reports:', error);
         return c.json({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' }, 500);
       }
     }
   }
   ```

6. **Register new endpoint in main worker/index.ts file**
   ```typescript
   // Add imports
   import { ReportsController } from './impl/controllers/ReportsController';
   import { FetchReportsUseCase } from './usecases/FetchReportsUseCase';
   
   // In the application configuration function
   
   // Initialize use case
   const fetchReportsUseCase = new FetchReportsUseCase(reportRepository);
   
   // Initialize controller
   const reportsController = new ReportsController(fetchReportsUseCase);
   
   // Register route
   app.get('/reports', (c) => reportsController.handleFetchReports(c));
   ```

7. **Tests**
   - Unit tests for new components
   - Integration tests for the entire flow
   - Performance tests for scenarios with high load and various sorting parameters

8. **Documentation**
   - Update API documentation
   - Add usage examples with various query parameters
   - Explain cursor-based pagination mechanism
