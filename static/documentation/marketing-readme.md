# Marketing Module

The Marketing Module is a comprehensive solution for managing marketing campaigns across multiple channels. It integrates with the Communications Module to provide a unified approach to customer engagement.

## Features

- **Multi-channel Campaigns**: Create, schedule, and manage marketing campaigns across various channels including email, SMS, WhatsApp, social media, and more.
- **Customer Segmentation**: Define target audiences using custom filters and criteria.
- **Reusable Templates**: Design and manage reusable content templates for consistent messaging across campaigns.
- **Performance Analytics**: Track campaign performance with metrics for sent, delivered, opened, clicked, and response rates.
- **A/B Testing**: Test different content variants to optimize campaign effectiveness.
- **Campaign Scheduling**: Schedule campaigns for future execution or run them immediately.

## Architecture

The Marketing Module follows a modular architecture that consists of:

1. **Database Schema**: Defined in `shared/schema/marketing.schema.ts`
2. **Module Core**: Base module file in `server/modules/marketing/marketing.module.ts`
3. **Services**:
   - `CampaignService`: Manages campaign CRUD and execution
   - `SegmentService`: Handles customer segmentation
   - `TemplateService`: Manages reusable content templates
4. **API Routes**:
   - Campaign routes (`/api/marketing/campaigns`)
   - Segment routes (`/api/marketing/segments`)
   - Template routes (`/api/marketing/templates`)

## Database Models

The Marketing Module uses the following database models:

1. **Campaigns**: Stores marketing campaign definitions
2. **Campaign Messages**: Links communications messages to campaigns
3. **Campaign Segments**: Defines customer segments for targeting
4. **Campaign Templates**: Stores reusable content templates

## Integration with Other Modules

The Marketing Module integrates with:

- **Communications Module**: For sending messages through various channels
- **CRM Module**: For accessing customer data for segmentation
- **Analytics Module**: For tracking campaign performance metrics

## API Endpoints

### Campaign Endpoints

- `POST /api/marketing/campaigns`: Create a new campaign
- `GET /api/marketing/campaigns`: List all campaigns with pagination and filtering
- `GET /api/marketing/campaigns/:id`: Get a campaign by ID
- `PUT /api/marketing/campaigns/:id`: Update a campaign
- `DELETE /api/marketing/campaigns/:id`: Delete a campaign
- `GET /api/marketing/campaigns/:id/performance`: Get campaign performance metrics
- `POST /api/marketing/campaigns/:id/schedule`: Schedule a campaign
- `POST /api/marketing/campaigns/:id/start`: Start a campaign immediately
- `POST /api/marketing/campaigns/:id/pause`: Pause an active campaign
- `POST /api/marketing/campaigns/:id/resume`: Resume a paused campaign

### Segment Endpoints

- `POST /api/marketing/segments`: Create a new segment
- `GET /api/marketing/segments`: List all segments with pagination and filtering
- `GET /api/marketing/segments/:id`: Get a segment by ID
- `PUT /api/marketing/segments/:id`: Update a segment
- `DELETE /api/marketing/segments/:id`: Delete a segment
- `POST /api/marketing/segments/:id/refresh`: Refresh segment reach
- `POST /api/marketing/segments/:id/clone`: Clone a segment
- `POST /api/marketing/segments/:id/toggle-status`: Toggle segment active status

### Template Endpoints

- `POST /api/marketing/templates`: Create a new template
- `GET /api/marketing/templates`: List all templates with pagination and filtering
- `GET /api/marketing/templates/:id`: Get a template by ID
- `PUT /api/marketing/templates/:id`: Update a template
- `DELETE /api/marketing/templates/:id`: Delete a template
- `GET /api/marketing/templates/categories/list`: Get template categories
- `POST /api/marketing/templates/:id/clone`: Clone a template
- `POST /api/marketing/templates/:id/toggle-status`: Toggle template active status

## Usage Example

### Creating a New Campaign

```typescript
// 1. Create a customer segment
const segment = await segmentService.createSegment({
  companyId: 'company-uuid',
  name: 'High-Value Customers',
  description: 'Customers with purchases over $1000 in the last 6 months',
  filterCriteria: {
    minPurchaseValue: 1000,
    purchaseDateRange: {
      start: subMonths(new Date(), 6),
      end: new Date()
    }
  }
}, 'user-uuid');

// 2. Create or use an existing template
const template = await templateService.createTemplate({
  companyId: 'company-uuid',
  name: 'Summer Sale Announcement',
  type: CampaignType.EMAIL,
  subject: 'Summer Sale - Up to 50% Off!',
  content: 'Our biggest summer sale is here! Shop now and save up to 50% on select items.',
  contentHtml: '<h1>Summer Sale!</h1><p>Our biggest summer sale is here! Shop now and save up to 50% on select items.</p>'
}, 'user-uuid');

// 3. Create the campaign
const campaign = await campaignService.createCampaign({
  companyId: 'company-uuid',
  name: 'Summer Sale 2025',
  description: 'Summer promotion for high-value customers',
  type: CampaignType.EMAIL,
  subject: 'Summer Sale - Up to 50% Off!',
  content: template.content,
  contentHtml: template.contentHtml,
  templateId: template.id,
  primaryChannel: CommunicationChannel.EMAIL,
  audienceType: AudienceType.SEGMENT,
  audienceId: segment.id
}, 'user-uuid');

// 4. Schedule the campaign
const scheduledCampaign = await campaignService.scheduleCampaign(
  campaign.id,
  'company-uuid',
  addDays(new Date(), 3), // Schedule for 3 days from now
  'user-uuid'
);
```

## Database Migration

To create the necessary database tables for the Marketing Module, run:

```bash
# Run the migration script
npx tsx migrate-marketing.ts
```