# PDF Document Signing API Documentation

This document describes the PDF document signing API endpoints that allow direct uploads of PDF files for electronic signature via PandaDoc integration.

## Features

- **Direct PDF Upload**: Upload PDF files directly for electronic signature
- **Template-Based Documents**: Create documents from PandaDoc templates
- **Multiple Signing Methods**: Sign both existing system documents and uploaded PDFs
- **Status Tracking**: Monitor document signing status in real-time
- **Shareable Links**: Generate secure signing links for recipients
- **JWT Authentication**: All endpoints secured with role-based access control

## API Endpoints

### 1. Upload PDF for Signing

Upload a PDF file and send it for electronic signature.

**Endpoint**: `POST /api/v1/documents/sign/pdf/upload`

**Headers**:
- `Authorization`: Bearer JWT token
- `Content-Type`: multipart/form-data

**Form Parameters**:
- `pdf`: The PDF file to be uploaded (required)
- `name`: Document name (required)
- `signerEmail`: Email of the signer (required)
- `signerName`: Name of the signer (required)
- `subject`: Email subject (optional)
- `message`: Email message (optional)
- `tags`: JSON array of string tags (optional)
- `metadata`: JSON object with additional metadata (optional)

**Response**:
```json
{
  "success": true,
  "message": "Document has been created and sent for signing",
  "data": {
    "pandaDocId": "string",
    "signerEmail": "string",
    "status": "string",
    "sentAt": "datetime"
  }
}
```

### 2. Sign Existing Document

Send an existing document for electronic signature.

**Endpoint**: `POST /api/v1/documents/sign/:id`

**Headers**:
- `Authorization`: Bearer JWT token
- `Content-Type`: application/json

**Path Parameters**:
- `id`: Document ID in the system

**Request Body**:
```json
{
  "signerEmail": "string",
  "signerName": "string",
  "subject": "string",
  "message": "string",
  "role": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Document has been submitted for signing",
  "data": {
    "documentId": "string",
    "pandaDocId": "string",
    "signerEmail": "string",
    "status": "string",
    "sentAt": "datetime"
  }
}
```

### 3. Check Signing Status

Check the status of a document being signed.

**Endpoint**: `GET /api/v1/documents/sign/status/:pandaDocId`

**Headers**:
- `Authorization`: Bearer JWT token

**Path Parameters**:
- `pandaDocId`: PandaDoc document ID

**Response**:
```json
{
  "success": true,
  "data": {
    "pandaDocId": "string",
    "status": "string",
    "updatedAt": "datetime"
  }
}
```

### 4. Generate Signing Link

Generate a shareable link for document signing.

**Endpoint**: `POST /api/v1/documents/sign/link/:pandaDocId`

**Headers**:
- `Authorization`: Bearer JWT token
- `Content-Type`: application/json

**Path Parameters**:
- `pandaDocId`: PandaDoc document ID

**Request Body** (optional):
```json
{
  "expiresIn": 86400
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pandaDocId": "string",
    "link": "string",
    "expiresAt": "datetime"
  }
}
```

## Document Signing Status Lifecycle

Documents go through the following status transitions during the signing process:

1. `document.draft` - Document has been created but not sent
2. `document.uploaded` - Document is being processed by PandaDoc
3. `document.processing` - Document is being prepared for signing
4. `document.completed` - Document processing is complete 
5. `document.sent` - Document has been sent to signers
6. `document.viewed` - Document has been viewed by signers
7. `document.waiting_approval` - Document is waiting for approval
8. `document.approved` - Document has been approved
9. `document.rejected` - Document has been rejected
10. `document.waiting_pay` - Document is waiting for payment
11. `document.paid` - Document has been paid
12. `document.completed` - Document signing complete
13. `document.declined` - Document has been declined by a signer
14. `document.expired` - Document signing has expired

## Error Handling

All API endpoints return proper error responses with appropriate HTTP status codes:

- `400` - Bad Request (missing required parameters)
- `401` - Unauthorized (invalid or missing JWT token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (document not found)
- `500` - Internal Server Error (PandaDoc API error or server-side issue)

## Security Considerations

- All endpoints require a valid JWT token with appropriate permissions
- PDF files are securely processed and not stored permanently on the server
- PandaDoc API integration uses a secure API key stored in environment variables
- Signing links have configurable expiration times for enhanced security

## Testing the API

Two test scripts are provided to verify the functionality:

1. `test-sign-document-pdf.ts` - Tests the direct PDF upload and signing workflow
2. `test-sign-document-api.ts` - Tests all API endpoints for document signing

You can run the tests with the following commands:

```bash
# First check if PandaDoc API key is configured
node -r tsx/register -e "console.log(process.env.PANDADOC_API_KEY ? 'API key is set' : 'API key is missing')"

# Run the service-level test
tsx test-sign-document-pdf.ts

# Run the API test
tsx test-sign-document-api.ts
```

Note: To run the tests successfully, you need to have the `PANDADOC_API_KEY` environment variable set.