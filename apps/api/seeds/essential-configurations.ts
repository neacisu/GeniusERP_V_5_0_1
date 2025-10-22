/**
 * Seed pentru configurările esențiale ale aplicației
 * Creează setări fundamentale pentru funcționarea sistemului
 */

import { v4 as uuidv4 } from 'uuid';

export async function seed(db: any) {
  console.log('🌱 Seeding essential configurations...');
  
  // Configurări esențiale pentru aplicație
  const essentialConfigs = [
    // System Settings
    {
      key: 'system.name',
      value: 'GeniusERP',
      scope: 'global',
      description: 'Numele sistemului'
    },
    {
      key: 'system.version',
      value: '5.0.1',
      scope: 'global',
      description: 'Versiunea sistemului'
    },
    {
      key: 'system.initialized',
      value: 'true',
      scope: 'global',
      description: 'Sistem inițializat'
    },
    {
      key: 'system.maintenance_mode',
      value: 'false',
      scope: 'global',
      description: 'Mod mentenanță'
    },
    
    // Security Settings
    {
      key: 'security.session_timeout',
      value: '3600',
      scope: 'global',
      description: 'Timeout sesiune (secunde)'
    },
    {
      key: 'security.password_min_length',
      value: '8',
      scope: 'global',
      description: 'Lungime minimă parolă'
    },
    {
      key: 'security.password_require_special',
      value: 'true',
      scope: 'global',
      description: 'Parolă necesită caractere speciale'
    },
    {
      key: 'security.max_login_attempts',
      value: '5',
      scope: 'global',
      description: 'Încercări maxime de login'
    },
    {
      key: 'security.lockout_duration',
      value: '900',
      scope: 'global',
      description: 'Durată blocare cont (secunde)'
    },
    
    // Email Settings
    {
      key: 'email.smtp_enabled',
      value: 'false',
      scope: 'global',
      description: 'SMTP activat'
    },
    {
      key: 'email.from_address',
      value: 'noreply@geniuserp.ro',
      scope: 'global',
      description: 'Adresă email expeditor'
    },
    {
      key: 'email.from_name',
      value: 'GeniusERP',
      scope: 'global',
      description: 'Nume expeditor'
    },
    
    // Accounting Settings
    {
      key: 'accounting.fiscal_year_start',
      value: '01-01',
      scope: 'global',
      description: 'Început an fiscal (MM-DD)'
    },
    {
      key: 'accounting.default_currency',
      value: 'RON',
      scope: 'global',
      description: 'Monedă implicită'
    },
    {
      key: 'accounting.vat_rate',
      value: '19',
      scope: 'global',
      description: 'Cotă TVA (%)'
    },
    {
      key: 'accounting.use_analytic_accounts',
      value: 'true',
      scope: 'global',
      description: 'Utilizare conturi analitice'
    },
    
    // HR Settings
    {
      key: 'hr.work_hours_per_day',
      value: '8',
      scope: 'global',
      description: 'Ore muncă pe zi'
    },
    {
      key: 'hr.work_days_per_week',
      value: '5',
      scope: 'global',
      description: 'Zile muncă pe săptămână'
    },
    {
      key: 'hr.vacation_days_per_year',
      value: '21',
      scope: 'global',
      description: 'Zile concediu pe an'
    },
    
    // Document Settings
    {
      key: 'documents.auto_numbering',
      value: 'true',
      scope: 'global',
      description: 'Numerotare automată documente'
    },
    {
      key: 'documents.require_signature',
      value: 'false',
      scope: 'global',
      description: 'Semnătură obligatorie documente'
    },
    {
      key: 'documents.max_file_size_mb',
      value: '10',
      scope: 'global',
      description: 'Dimensiune maximă fișier (MB)'
    },
    
    // Notification Settings
    {
      key: 'notifications.enabled',
      value: 'true',
      scope: 'global',
      description: 'Notificări activate'
    },
    {
      key: 'notifications.email_enabled',
      value: 'true',
      scope: 'global',
      description: 'Notificări email activate'
    },
    {
      key: 'notifications.push_enabled',
      value: 'false',
      scope: 'global',
      description: 'Notificări push activate'
    },
    
    // Backup Settings
    {
      key: 'backup.enabled',
      value: 'true',
      scope: 'global',
      description: 'Backup activat'
    },
    {
      key: 'backup.frequency',
      value: 'daily',
      scope: 'global',
      description: 'Frecvență backup (daily/weekly/monthly)'
    },
    {
      key: 'backup.retention_days',
      value: '30',
      scope: 'global',
      description: 'Zile retenție backup'
    },
    
    // API Settings
    {
      key: 'api.rate_limit_enabled',
      value: 'true',
      scope: 'global',
      description: 'Rate limiting API activat'
    },
    {
      key: 'api.rate_limit_per_minute',
      value: '60',
      scope: 'global',
      description: 'Request-uri maxime pe minut'
    },
    
    // Logging Settings
    {
      key: 'logging.level',
      value: 'info',
      scope: 'global',
      description: 'Nivel logging (debug/info/warn/error)'
    },
    {
      key: 'logging.retention_days',
      value: '90',
      scope: 'global',
      description: 'Zile retenție log-uri'
    }
  ];
  
  console.log(`Creating ${essentialConfigs.length} configurations...`);
  
  // Inserează configurările
  for (const config of essentialConfigs) {
    await db.execute(`
      INSERT INTO configurations (id, key, value, scope, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (key, scope) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW()
    `, [uuidv4(), config.key, config.value, config.scope, config.description]);
  }
  
  console.log('✅ Created/updated essential configurations');
  console.log('🎉 Essential configurations seeding completed!');
}

export default seed;

