# Marketing Module Controllers

This directory contains controllers for the Marketing module, following the controller-based architecture pattern.

## Overview

The controllers in this directory handle business logic for marketing operations, separating it from the route definitions. This approach provides better organization, reusability, and testability.

## Controllers

- **CampaignController** (`campaign.controller.ts`): Handles marketing campaign operations including CRUD, scheduling, starting, pausing, and resuming campaigns
- **SegmentController** (`segment.controller.ts`): Manages audience segmentation for targeted marketing
- **TemplateController** (`template.controller.ts`): Manages content templates used in marketing campaigns

## Implementation Notes

1. Each controller is exported as both a class and a singleton instance
2. Controllers handle validation using Zod schemas
3. All controllers use proper audit logging via AuditService
4. Error handling follows a consistent pattern
5. Each controller method is properly documented

## Key Endpoints in CampaignController

- **createCampaign**: Creates a new marketing campaign
- **listCampaigns**: Lists all campaigns with filtering and pagination
- **getCampaignById**: Gets a specific campaign by ID
- **updateCampaign**: Updates an existing campaign
- **deleteCampaign**: Removes a campaign
- **getCampaignPerformance**: Gets performance metrics for a campaign
- **scheduleCampaign**: Schedules a campaign for future execution
- **startCampaign**: Starts a campaign immediately
- **pauseCampaign**: Pauses an active campaign
- **resumeCampaign**: Resumes a paused campaign

## Key Endpoints in SegmentController

- **createSegment**: Creates a new audience segment
- **listSegments**: Lists all segments with filtering and pagination
- **getSegmentById**: Gets a specific segment by ID
- **updateSegment**: Updates an existing segment
- **deleteSegment**: Removes a segment
- **refreshSegment**: Refreshes audience count for a segment
- **getSegmentMembers**: Gets preview of segment members

## Key Endpoints in TemplateController

- **createTemplate**: Creates a new content template
- **listTemplates**: Lists all templates with filtering and pagination
- **getTemplateById**: Gets a specific template by ID
- **updateTemplate**: Updates an existing template
- **deleteTemplate**: Removes a template
- **previewTemplate**: Renders a template with test variables
- **duplicateTemplate**: Creates a copy of an existing template

## Usage in Routes

To use these controllers in route files, import them and delegate request handling to the appropriate controller method:

```typescript
import { Router } from 'express';
import { campaignController } from '../controllers';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const router = Router();

router.post('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => campaignController.createCampaign(req, res).catch(next)
);

export default router;
```

## Integration with Other Modules

The Marketing controllers integrate with the following modules:

- **Communications Module**: For sending campaign messages
- **CRM Module**: For accessing customer data for segmentation
- **Analytics Module**: For tracking campaign performance metrics

## Future Improvements

- Add detailed OpenAPI documentation for each endpoint
- Implement comprehensive unit tests for all controllers
- Add role-based access control for finer permissions
- Enhance validation with more specific error messages
