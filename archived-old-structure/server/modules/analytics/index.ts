/**
 * Analytics Module Index
 * 
 * This file serves as the entry point for the analytics module,
 * exporting all necessary components for use in the main application.
 */

// Export module initializer
export { initAnalyticsModule } from './analytics.module';

// Export authentication guards
export { AnalyticsRoles } from './auth/auth.types';

// Export schemas and types
export * from './schema/analytics.schema';
export * from './schema/predictive.schema';

// Export services
export { AnalyticsService } from './services/analytics.service';
export { PredictiveService as PredictiveAnalyticsService } from './services/predictive.service';

// Export routes setup functions
export { setupAnalyticsRoutes } from './routes/analytics.routes';
export { setupPredictiveAnalyticsRoutes } from './routes/predictive.routes.fixed';

// Export analytics constants and utilities
// export { ReportType, VisualizationType } from './schema/analytics.schema'; // TODO: implement these types
export { PredictionModelType, PredictionType } from './schema/predictive.schema';