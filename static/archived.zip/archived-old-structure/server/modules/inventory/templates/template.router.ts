/**
 * Template Router
 * 
 * This router handles requests for template files for importing data
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Create a router
const templateRouter = Router();

// GET endpoint for template files
templateRouter.get('/excel/:type', (req: Request, res: Response) => {
  const templateType = req.params.type;
  
  try {
    // Pentru rezolvarea problemei Excel, descărcăm fișierul CSV ca CSV
    const csvFilePath = path.join(process.cwd(), 'public', 'templates', `template_${templateType}.csv`);
    if (fs.existsSync(csvFilePath)) {
      // Setăm MIME type-ul și headerele pentru CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateType}.csv"`);
      
      // Creăm un stream și îl trimitem ca răspuns
      const fileStream = fs.createReadStream(csvFilePath);
      fileStream.pipe(res);
      
      console.log(`Serving CSV template for: ${templateType} (Excel fallback)`);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error getting template file:', error);
    res.status(500).json({ error: 'Failed to retrieve template file' });
  }
});

// GET endpoint for CSV templates
templateRouter.get('/csv/:type', (req: Request, res: Response) => {
  const templateType = req.params.type;
  
  try {
    const csvFilePath = path.join(process.cwd(), 'public', 'templates', `template_${templateType}.csv`);
    if (fs.existsSync(csvFilePath)) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateType}.csv"`);
      
      const fileStream = fs.createReadStream(csvFilePath);
      fileStream.pipe(res);
      
      console.log(`Serving CSV template for: ${templateType}`);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error getting CSV template:', error);
    res.status(500).json({ error: 'Failed to retrieve CSV template' });
  }
});

// GET endpoint for JSON templates
templateRouter.get('/json/:type', (req: Request, res: Response) => {
  const templateType = req.params.type;
  
  try {
    const jsonFilePath = path.join(process.cwd(), 'public', 'templates', `template_${templateType}.json`);
    if (fs.existsSync(jsonFilePath)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateType}.json"`);
      
      const fileStream = fs.createReadStream(jsonFilePath);
      fileStream.pipe(res);
      
      console.log(`Serving JSON template for: ${templateType}`);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error getting JSON template:', error);
    res.status(500).json({ error: 'Failed to retrieve JSON template' });
  }
});

export default templateRouter;