#!/usr/bin/env tsx

/**
 * API de Control pentru Orchestrator Teste
 * 
 * Funcționalități:
 * - Start/Stop teste
 * - Clear logs
 * - Status orchestrator
 * - Restart teste failed
 */

import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { createModuleLogger } from './shared/logger';
import { getMetrics, resetMetrics } from './shared/metrics';

const app = express();
const PORT = parseInt(process.env.TEST_CONTROL_PORT || '9091', 10);
const LOGS_DIR = '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/utils/testing/logs';
const ORCHESTRATOR_PATH = '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/utils/testing/orchestrator.ts';

const logger = createModuleLogger('control-api', 'system');

// Middleware
app.use(express.json());

// CORS pentru acces din Grafana
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// State management
let orchestratorProcess: ChildProcess | null = null;
let orchestratorStatus: 'idle' | 'running' | 'stopping' = 'idle';
let lastStartTime: Date | null = null;
let lastStopTime: Date | null = null;

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'test-control-api',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Status orchestrator
 */
app.get('/status', (req: Request, res: Response) => {
  res.json({
    status: orchestratorStatus,
    pid: orchestratorProcess?.pid || null,
    lastStartTime: lastStartTime?.toISOString() || null,
    lastStopTime: lastStopTime?.toISOString() || null,
    uptime: lastStartTime ? Date.now() - lastStartTime.getTime() : 0,
  });
});

/**
 * Start teste
 */
app.post('/start', async (req: Request, res: Response) => {
  try {
    if (orchestratorStatus === 'running') {
      return res.status(400).json({
        error: 'Orchestrator is already running',
        status: orchestratorStatus,
      });
    }

    logger.info('🚀 Pornire orchestrator prin API...');

    const {
      modules = ['all'],
      types = ['all'],
      parallel = 4,
      verbose = true,
      dashboard = true,
      failFast = false,
    } = req.body;

    // Construire argumente
    const args = [
      ORCHESTRATOR_PATH,
      '--modules', ...modules,
      '--types', ...types,
      '--parallel', parallel.toString(),
    ];

    if (verbose) args.push('--verbose');
    if (dashboard) args.push('--dashboard');
    if (failFast) args.push('--fail-fast');

    // Pornire proces orchestrator
    orchestratorProcess = spawn('tsx', args, {
      cwd: path.dirname(ORCHESTRATOR_PATH),
      env: { ...process.env },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    orchestratorStatus = 'running';
    lastStartTime = new Date();

    // Log output
    orchestratorProcess.stdout?.on('data', (data) => {
      logger.info(`[Orchestrator] ${data.toString().trim()}`);
    });

    orchestratorProcess.stderr?.on('data', (data) => {
      logger.error(`[Orchestrator Error] ${data.toString().trim()}`);
    });

    // Monitor exit
    orchestratorProcess.on('exit', (code) => {
      logger.info(`Orchestrator s-a oprit cu codul: ${code}`);
      orchestratorStatus = 'idle';
      lastStopTime = new Date();
      orchestratorProcess = null;
    });

    res.json({
      success: true,
      message: 'Orchestrator pornit cu succes',
      pid: orchestratorProcess.pid,
      config: { modules, types, parallel, verbose, dashboard, failFast },
      startTime: lastStartTime.toISOString(),
    });

    logger.info(`✅ Orchestrator pornit cu PID: ${orchestratorProcess.pid}`);

  } catch (error) {
    logger.error('❌ Eroare la pornirea orchestrator', { error });
    res.status(500).json({
      error: 'Failed to start orchestrator',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Stop teste
 */
app.post('/stop', async (req: Request, res: Response) => {
  try {
    if (orchestratorStatus !== 'running' || !orchestratorProcess) {
      return res.status(400).json({
        error: 'Orchestrator is not running',
        status: orchestratorStatus,
      });
    }

    logger.info('⏹️  Oprire orchestrator prin API...');

    orchestratorStatus = 'stopping';

    // Trimite SIGTERM pentru graceful shutdown
    orchestratorProcess.kill('SIGTERM');

    // Timeout pentru force kill
    setTimeout(() => {
      if (orchestratorProcess && !orchestratorProcess.killed) {
        logger.warn('⚠️  Force killing orchestrator...');
        orchestratorProcess.kill('SIGKILL');
      }
    }, 10000); // 10 secunde timeout

    lastStopTime = new Date();

    res.json({
      success: true,
      message: 'Orchestrator oprit cu succes',
      stopTime: lastStopTime.toISOString(),
    });

    logger.info('✅ Orchestrator oprit');

  } catch (error) {
    logger.error('❌ Eroare la oprirea orchestrator', { error });
    res.status(500).json({
      error: 'Failed to stop orchestrator',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Restart orchestrator
 */
app.post('/restart', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Restart orchestrator prin API...');

    // Stop dacă rulează
    if (orchestratorStatus === 'running' && orchestratorProcess) {
      orchestratorProcess.kill('SIGTERM');
      
      // Așteaptă să se oprească
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Start din nou
    const startResponse = await fetch(`http://localhost:${PORT}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const startData = await startResponse.json();

    res.json({
      success: true,
      message: 'Orchestrator restartat cu succes',
      ...startData,
    });

    logger.info('✅ Orchestrator restartat');

  } catch (error) {
    logger.error('❌ Eroare la restart orchestrator', { error });
    res.status(500).json({
      error: 'Failed to restart orchestrator',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Clear logs
 */
app.post('/clear-logs', async (req: Request, res: Response) => {
  try {
    logger.info('🧹 Ștergere logs prin API...');

    const logFiles = [
      path.join(LOGS_DIR, 'test-all.log'),
      path.join(LOGS_DIR, 'test-errors.log'),
    ];

    let clearedCount = 0;
    let totalSize = 0;

    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        totalSize += stats.size;
        
        // Truncate file (păstrează fișierul dar șterge conținutul)
        fs.writeFileSync(logFile, '');
        clearedCount++;
        
        logger.info(`✓ Șters: ${logFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }

    res.json({
      success: true,
      message: 'Logs șterse cu succes',
      clearedFiles: clearedCount,
      freedSpace: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toISOString(),
    });

    logger.info(`✅ ${clearedCount} fișiere de log șterse (${(totalSize / 1024 / 1024).toFixed(2)} MB eliberat)`);

  } catch (error) {
    logger.error('❌ Eroare la ștergerea logs', { error });
    res.status(500).json({
      error: 'Failed to clear logs',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Clear metrics
 */
app.post('/clear-metrics', async (req: Request, res: Response) => {
  try {
    logger.info('🧹 Resetare metrics prin API...');

    resetMetrics();

    res.json({
      success: true,
      message: 'Metrics resetate cu succes',
      timestamp: new Date().toISOString(),
    });

    logger.info('✅ Metrics resetate');

  } catch (error) {
    logger.error('❌ Eroare la resetarea metrics', { error });
    res.status(500).json({
      error: 'Failed to clear metrics',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get metrics (Prometheus format)
 */
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('❌ Eroare la obținerea metrics', { error });
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get logs (recent)
 */
app.get('/logs', async (req: Request, res: Response) => {
  try {
    const { lines = 100, type = 'all' } = req.query;

    const logFile = type === 'errors'
      ? path.join(LOGS_DIR, 'test-errors.log')
      : path.join(LOGS_DIR, 'test-all.log');

    if (!fs.existsSync(logFile)) {
      return res.json({
        logs: [],
        message: 'No logs found',
      });
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    const recentLines = allLines.slice(-Number(lines));

    res.json({
      logs: recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line };
        }
      }),
      total: allLines.length,
      returned: recentLines.length,
      file: logFile,
    });

  } catch (error) {
    logger.error('❌ Eroare la obținerea logs', { error });
    res.status(500).json({
      error: 'Failed to get logs',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get test reports
 */
interface TestReport {
  type: string;
  path: string;
  data?: unknown;
}

app.get('/reports', async (req: Request, res: Response) => {
  try {
    const reportsDir = path.join(path.dirname(LOGS_DIR), 'reports');
    
    const reports: TestReport[] = [];

    // JSON reports
    const jsonReportPath = path.join(reportsDir, 'json', 'test-results.json');
    if (fs.existsSync(jsonReportPath)) {
      const content = fs.readFileSync(jsonReportPath, 'utf-8');
      reports.push({
        type: 'json',
        path: jsonReportPath,
        data: JSON.parse(content),
      });
    }

    res.json({
      reports,
      available: reports.length > 0,
    });

  } catch (error) {
    logger.error('❌ Eroare la obținerea reports', { error });
    res.status(500).json({
      error: 'Failed to get reports',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Trigger specific module tests
 */
app.post('/test/:module', async (req: Request, res: Response) => {
  try {
    const { module } = req.params;
    const { types = ['all'], parallel = 4 } = req.body;

    logger.info(`🎯 Pornire teste pentru modulul: ${module}`);

    // Verifică dacă orchestrator rulează deja
    if (orchestratorStatus === 'running') {
      return res.status(400).json({
        error: 'Orchestrator is already running',
        message: 'Please stop current tests before starting new ones',
      });
    }

    // Start teste pentru modulul specific
    const startResponse = await fetch(`http://localhost:${PORT}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modules: [module],
        types,
        parallel,
        verbose: true,
        dashboard: true,
      }),
    });

    const data = await startResponse.json();

    res.json({
      success: true,
      message: `Teste pornite pentru modulul ${module}`,
      ...data,
    });

  } catch (error) {
    logger.error('❌ Eroare la pornirea testelor pentru modul', { error });
    res.status(500).json({
      error: 'Failed to start module tests',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Server startup
 */
app.listen(PORT, () => {
  logger.info(`🚀 Test Control API pornit pe portul ${PORT}`);
  logger.info(`   - Status: http://localhost:${PORT}/status`);
  logger.info(`   - Start: POST http://localhost:${PORT}/start`);
  logger.info(`   - Stop: POST http://localhost:${PORT}/stop`);
  logger.info(`   - Clear Logs: POST http://localhost:${PORT}/clear-logs`);
  logger.info(`   - Metrics: http://localhost:${PORT}/metrics`);
  logger.info(`   - Logs: http://localhost:${PORT}/logs`);
  logger.warn('');
  logger.warn('='.repeat(80));
  logger.warn('🎮 Test Control API Ready');
  logger.warn('='.repeat(80));
  logger.warn('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('⏹️  SIGTERM primit, oprire graceful...');
  
  if (orchestratorProcess) {
    orchestratorProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('⏹️  SIGINT primit, oprire graceful...');
  
  if (orchestratorProcess) {
    orchestratorProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

