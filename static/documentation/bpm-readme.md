# Business Process Management (BPM) Module

## Overview
The Business Process Management (BPM) module provides automation capabilities for business processes such as approvals, document processing, notifications, and integrations. It follows a standardized workflow model with process definitions, process instances, and step executions.

## Architecture

### Core Components
- **Process Definitions**: Templates defining business processes and their steps
- **Process Instances**: Running instances of process definitions
- **Step Templates**: Reusable components that can be included in process definitions
- **Step Executions**: Individual execution instances of steps within a process instance
- **Triggers**: Events that can start or advance process instances
- **Scheduled Jobs**: Time-based actions for process automation
- **API Connections**: Interfaces for connecting processes with external systems

### Module Structure
The BPM module is implemented as a singleton service with multiple components:
- `BpmModule`: Main module class that manages initialization and registration
- `ProcessService`: Handles process definitions and instances
- `TriggerService`: Manages event triggers and their handlers
- `ScheduledJobService`: Manages time-based task execution

## API Endpoints

### Process Management
- `POST /api/bpm/process-placeholder`: Placeholder for process creation requests

### Process Templates
- `GET /api/bpm/processes/templates`: List available process templates
- `POST /api/bpm/processes/templates/:templateId/create`: Create a process from a template

## Usage Examples

### Creating a Process from Template
```typescript
// Example client code
const response = await fetch('/api/bpm/processes/templates/invoice-approval/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'April Invoice Approval',
    companyId: 'c23e4567-e89b-12d3-a456-426614174000'
  })
});

const process = await response.json();
```

### Using the Process Placeholder Endpoint
```typescript
// Example client code
const response = await fetch('/api/bpm/process-placeholder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'AWB Generation',
    description: 'Automated AWB generation for orders',
    companyId: 'c23e4567-e89b-12d3-a456-426614174000'
  })
});

const result = await response.json();
```

## Authentication and Security
All BPM endpoints are protected with JWT authentication. Users must have appropriate roles to access process management features.

## Audit Logging
All actions in the BPM module are logged to the audit system with the `BPM_PROCESS_ACTION` action type. This includes process creation, execution, and completion events.

## Testing
Use the `test-bpm-process-endpoint.ts` script to test the BPM module's endpoints:

```bash
npx tsx test-bpm-process-endpoint.ts
```

## Future Development
- Process visualization and workflow diagrams
- Advanced conditions and branching logic
- Integration with notification systems
- SLA monitoring and escalation paths
- Process analytics and performance metrics