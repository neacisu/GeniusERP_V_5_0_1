/**
 * Examples Module Initialization
 */

import { Express } from 'express';
import { ExamplesModule } from './examples.module';

export function initExampleModule(app: Express) {
  const { routes } = ExamplesModule.register(app);
  return { routes };
}