# API Endpoint Implementation Plan: POST `/report/delete`

## 1. Endpoint Overview
The `/report/delete` endpoint allows users to delete a previously generated scan report and its associated PNG image used for sharing. The operation requires authorization via a unique deletion token that was generated during the report creation and is known only to its creator. The endpoint implements a rate limiting mechanism to prevent abuse.

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/report/delete`
- **Parameters**:
  - **Required**: No parameters in URL
  - **Optional**: No parameters in URL
- **Request Body**:
  ```json
  {
    "hash": "ab12...ef", // 32-character hexadecimal identifier of the report
    "deleteToken": "7fa4...9c" // 32-character authorization token
  }
  ```

## 3. Types Used
```typescript
// Existing types from src/types.ts
import { DeleteReportRequestDTO, DeleteReportResponseDTO } from "../types";

// Additional types needed for implementation
interface DeleteReportCommandModel {
  hash: string; // 32-character hexadecimal identifier
  deleteToken: string; // 32-character authorization token
}
```

## 4. Response Details

### Successful Response (204 No Content)
- No response body
- Headers:
  ```
  Status: 204 No Content
  ```

### Errors

- **401 Unauthorized**: Invalid token or hash/token mismatch
  ```json
  { 
    "error": "Invalid hash or deleteToken",
    "code": "UNAUTHORIZED" 
  }
  ```

- **429 Too Many Requests**: Exceeded limit of 5 deletion attempts per IP per hour
  ```json
  { 
    "error": "Rate limit exceeded: Maximum 5 delete attempts per hour",
    "code": "RATE_LIMIT_EXCEEDED" 
  }
  ```

- **400 Bad Request**: Invalid format for hash or deleteToken
  ```json
  { 
    "error": "Invalid format for hash or deleteToken",
    "code": "INVALID_FORMAT" 
  }
  ```

## 5. Data Flow

1. **Input Validation**: 
   - Check if hash and deleteToken are present in the request
   - Check if hash and deleteToken are exactly 32 characters and contain only hexadecimal characters
   - Check if the client's IP has not exceeded the limit of 5 deletion attempts per hour

2. **Authorization**:
   - Retrieve the report from the database based on the hash
   - Verify that the deleteToken matches the token stored in the database
   - If the token doesn't match, return a 401 Unauthorized error

3. **Deletion**:
   - Delete the report from the `reports` table in the D1 database
   - If the report has an associated image (share_image_key is not null), delete the image from the R2 bucket

4. **Response**:
   - Return a 204 No Content response in case of success
   - In case of an error, return the appropriate error code and message

## 6. Security Considerations

1. **Input Data Validation**:
   - Strict validation of hash and deleteToken format (exactly 32 hexadecimal characters)
   - Sanitization of all input data before using it in SQL queries

2. **Protection Against Attacks**:
   - Implementation of rate limiting (5 deletion attempts per IP per hour) using Cloudflare WAF
   - Constant time token verification to prevent timing attacks
   - Logging of failed authorization attempts to monitor potential attacks

3. **Authorization**:
   - Verification that the deleteToken matches the token stored in the database
   - No possibility to recover the deleteToken - if the user loses it, they cannot delete the report

## 7. Error Handling

1. **Invalid Input Data**:
   - Code: 400 Bad Request
   - Causes: Missing required fields, invalid format for hash or deleteToken

2. **Authorization Errors**:
   - Code: 401 Unauthorized
   - Causes: Invalid token, hash/token mismatch, report doesn't exist

3. **Rate Limit Exceeded**:
   - Code: 429 Too Many Requests
   - Causes: Exceeded the limit of 5 deletion attempts per IP per hour
   - Implementation: Using Cloudflare mechanisms to track and enforce limits

4. **Internal Errors**:
   - Code: 500 Internal Server Error
   - Causes: Database problems, R2 problems, unforeseen exceptions
   - Logging: Detailed logging to Logflare through Cloudflare Logpush

## 8. Performance Considerations

1. **Database Optimization**:
   - Utilizing an index on the `hash` column in the `reports` table for fast lookups
   - Using prepared SQL queries for better performance and security

2. **Concurrency Handling**:
   - Implementing transactions for deletion operations to ensure data consistency
   - Handling cases where a report is being deleted concurrently by multiple requests

3. **Minimizing Latency**:
   - Asynchronous deletion of the image from R2 after deleting the record from the database
   - Quick return of the 204 response after confirming deletion from the database

## 9. Implementation Steps

1. **Extend the ReportRepository Interface**:
   - Add method `deleteByHashAndToken(hash: string, deleteToken: string): Promise<boolean>`

2. **Implement the Method in D1ReportRepository**:
   - Implement logic for verifying and deleting the report from the database
   - Handle the case where the report doesn't exist or the token doesn't match

3. **Create an ImageRepository Interface**:
   - Define method `deleteImage(key: string): Promise<void>`

4. **Implement R2ImageRepository**:
   - Implement logic for deleting an image from the R2 bucket

5. **Create the DeleteReportUseCase**:
   - Implement business logic for deleting a report
   - Coordinate deletion from the database and from R2
   - Handle validation and authorization

6. **Create the DeleteReportController**:
   - Implement HTTP request handling
   - Validate input data
   - Pass the request to the use case
   - Handle responses and errors

7. **Register the Endpoint in the Main worker/index.ts File**:
   - Add the POST `/report/delete` route
   - Configure dependencies
   - Implement error handling

8. **Implement Rate Limiting**:
   - Configure Cloudflare WAF for the limit of 5 deletion attempts per IP per hour
   - Implement handling of 429 Too Many Requests error

9. **Testing**:
   - Unit tests for each component
   - Integration tests for the entire flow
   - Security tests (unauthorized deletion attempts, brute force attacks)
