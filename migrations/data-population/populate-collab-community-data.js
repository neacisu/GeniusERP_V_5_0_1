/**
 * Populate Collaboration Community Data Script
 * 
 * This script adds real content to the collaboration_threads and collaboration_messages tables
 * to populate all community pages (announcements, questions, ideas, events, resources, tutorials).
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const { Client } = pg;

// Community categories
const CATEGORIES = {
  ANUNTURI: 'ANUNTURI',
  INTREBARI: 'INTREBARI',
  IDEI: 'IDEI',
  EVENIMENTE: 'EVENIMENTE',
  RESURSE: 'RESURSE',
  TUTORIALE: 'TUTORIALE'
};

// Company and user IDs from the database
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';
const ADMIN_USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';

// Connect to the database
async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  console.log('Connected to database');
  return client;
}

// Create threads for each category
async function createThreads(client) {
  console.log('Creating collaboration threads...');
  
  // Data for each category
  const threadsData = [
    // ANUNTURI (Announcements)
    {
      title: 'Actualizare importantă a platformei GeniusERP v5.2',
      description: 'Vă informăm că pe data de 20 aprilie 2025 va fi implementată o actualizare majoră a platformei GeniusERP. Noua versiune v5.2 aduce îmbunătățiri semnificative în modulele de Contabilitate și Resurse Umane. În timpul actualizării, sistemul va fi indisponibil între orele 23:00-01:00.',
      category: CATEGORIES.ANUNTURI,
      tags: ['actualizare', 'mentenanță', 'sistem'],
      metadata: { pinned: true, importance: 'high' }
    },
    {
      title: 'Noi funcționalități în modulul de Colaborare',
      description: 'Am lansat noile funcționalități pentru modulul de Colaborare, inclusiv integrarea cu Microsoft Teams și Slack. Aceste actualizări facilitează comunicarea internă și partajarea documentelor între departamente.',
      category: CATEGORIES.ANUNTURI,
      tags: ['colaborare', 'integrare', 'teams', 'slack'],
      metadata: { pinned: false, importance: 'medium' }
    },
    {
      title: 'Mentenanță programată - 10 mai 2025',
      description: 'În data de 10 mai 2025, între orele 22:00-23:30, vom efectua lucrări de mentenanță pentru optimizarea performanței bazei de date. În această perioadă, accesul la modulele Contabilitate și Raportare va fi restricționat.',
      category: CATEGORIES.ANUNTURI,
      tags: ['mentenanță', 'bază de date', 'performanță'],
      metadata: { pinned: true, importance: 'medium' }
    },
    
    // INTREBARI (Questions)
    {
      title: 'Cum se generează rapoarte personalizate în modulul Contabilitate?',
      description: 'Aș dori să știu cum pot genera rapoarte personalizate în modulul de Contabilitate care să includă date din ultimele 3 luni grupate pe centre de cost? Care sunt pașii necesari pentru configurare?',
      category: CATEGORIES.INTREBARI,
      tags: ['contabilitate', 'rapoarte', 'centre de cost'],
      metadata: { solved: false, viewCount: 15 }
    },
    {
      title: 'Cum pot integra platforma de facturare electronică cu GeniusERP?',
      description: 'Există vreo modalitate de a conecta API-ul platformei noastre de facturare electronică cu GeniusERP pentru sincronizarea automată a facturilor? Ce setări sunt necesare în modulul de Integrări?',
      category: CATEGORIES.INTREBARI,
      tags: ['facturare', 'integrare', 'api', 'sincronizare'],
      metadata: { solved: true, viewCount: 28 }
    },
    {
      title: 'Configurare drepturi de acces pentru departamentul Financiar',
      description: 'Avem nevoie să configurăm drepturile de acces pentru departamentul Financiar astfel încât să aibă acces la modulele Contabilitate și Trezorerie, dar nu și la Vânzări și Marketing. Cum putem face acest lucru la nivel de departament, nu individual?',
      category: CATEGORIES.INTREBARI,
      tags: ['drepturi', 'acces', 'financiar', 'roluri'],
      metadata: { solved: false, viewCount: 10 }
    },
    
    // IDEI (Ideas)
    {
      title: 'Implementarea unui dashboard de productivitate pentru echipe',
      description: 'Propun implementarea unui dashboard interactiv care să afișeze metricile de productivitate pentru fiecare echipă: task-uri finalizate, timp mediu de rezolvare, blocaje identificate. Acesta ar oferi managerilor o vizibilitate mai bună asupra performanței echipelor.',
      category: CATEGORIES.IDEI,
      tags: ['productivitate', 'dashboard', 'management'],
      metadata: { votes: 12, status: 'in_review', implemented: false }
    },
    {
      title: 'Aplicație mobilă pentru aprobări rapide',
      description: 'Sugerez dezvoltarea unei aplicații mobile dedicate pentru aprobări rapide (facturi, concedii, deplasări), care să permită managerilor să aprobe sau să respingă solicitări direct de pe telefon prin notificări push. Ar crește semnificativ viteza proceselor interne.',
      category: CATEGORIES.IDEI,
      tags: ['mobil', 'aprobări', 'workflow', 'notificări'],
      metadata: { votes: 23, status: 'approved', implemented: false }
    },
    {
      title: 'Integrare cu platformele de e-learning pentru formarea angajaților',
      description: 'Ar fi utilă o integrare cu platforme de e-learning (precum Udemy for Business sau LinkedIn Learning) direct în modulul HR, pentru a putea atribui cursuri angajaților și a urmări progresul acestora în dezvoltarea competențelor.',
      category: CATEGORIES.IDEI,
      tags: ['hr', 'învățare', 'training', 'competențe'],
      metadata: { votes: 8, status: 'new', implemented: false }
    },
    
    // EVENIMENTE (Events)
    {
      title: 'Workshop: Noutăți fiscale 2025',
      description: 'Vă invităm la workshopul "Noutăți fiscale 2025" organizat de departamentul nostru de Contabilitate. Vom discuta despre modificările recente din Codul Fiscal și impactul acestora asupra operațiunilor zilnice în GeniusERP.',
      category: CATEGORIES.EVENIMENTE,
      tags: ['workshop', 'fiscal', 'contabilitate', 'formare'],
      metadata: { 
        date: '2025-05-15T14:00:00',
        location: 'Sala de conferințe - Sediul central',
        duration: 120,
        registration_required: true,
        max_participants: 30
      }
    },
    {
      title: 'Training online: Raportare avansată în GeniusERP',
      description: 'Sesiune de training online dedicată funcționalităților avansate de raportare din GeniusERP. Vom acoperi rapoartele personalizate, dashboardurile interactive și exportul automat de date pentru analiză externă.',
      category: CATEGORIES.EVENIMENTE,
      tags: ['training', 'raportare', 'analiză', 'online'],
      metadata: { 
        date: '2025-04-22T10:00:00',
        location: 'Microsoft Teams',
        duration: 90,
        registration_required: true,
        max_participants: 50
      }
    },
    {
      title: 'Lansarea modulului de Business Intelligence',
      description: 'Vă invităm la evenimentul de lansare a noului modul de Business Intelligence din GeniusERP. Veți descoperi cum puteți transforma datele companiei în insight-uri strategice pentru decizia de business.',
      category: CATEGORIES.EVENIMENTE,
      tags: ['lansare', 'bi', 'analiză', 'insight'],
      metadata: { 
        date: '2025-05-28T15:30:00',
        location: 'Hotel Continental - Sala Viena',
        duration: 180,
        registration_required: true,
        max_participants: 100
      }
    },
    
    // RESURSE (Resources)
    {
      title: 'Ghid complet pentru configurarea modulului de Producție',
      description: 'Acest ghid detaliază toți pașii necesari pentru configurarea corectă a modulului de Producție în GeniusERP, inclusiv definirea centrelor de producție, rutele tehnologice, normele de timp și consumurile specifice de materiale.',
      category: CATEGORIES.RESURSE,
      tags: ['producție', 'configurare', 'ghid', 'implementare'],
      metadata: { 
        type: 'document',
        file_type: 'pdf',
        size: 2.4,
        pages: 32,
        download_count: 45
      }
    },
    {
      title: 'Template-uri Excel pentru importul de date',
      description: 'Colecție de template-uri Excel pregătite pentru importul de date în diferite module GeniusERP: produse, clienți, furnizori, liste de prețuri, stocuri inițiale.',
      category: CATEGORIES.RESURSE,
      tags: ['import', 'excel', 'date', 'template'],
      metadata: { 
        type: 'download',
        file_type: 'xlsx',
        size: 1.2,
        files_count: 8,
        download_count: 78
      }
    },
    {
      title: 'Proceduri standard de operare pentru modulul Financiar',
      description: 'Document complet cu procedurile standard de operare pentru modulul Financiar, incluzând procesarea facturilor de la furnizori, reconciliere bancară, raportare TVA și închidere de lună.',
      category: CATEGORIES.RESURSE,
      tags: ['proceduri', 'financiar', 'operațiuni', 'standard'],
      metadata: { 
        type: 'document',
        file_type: 'pdf',
        size: 3.1,
        pages: 47,
        download_count: 23
      }
    },
    
    // TUTORIALE (Tutorials)
    {
      title: 'Configurarea fluxurilor de aprobare pentru cheltuieli',
      description: 'Acest tutorial prezintă pașii necesari pentru configurarea fluxurilor complexe de aprobare a cheltuielilor, cu multiple niveluri de autorizare bazate pe departament, sumă și categorie de cheltuială.',
      category: CATEGORIES.TUTORIALE,
      tags: ['workflow', 'aprobare', 'cheltuieli', 'configurare'],
      metadata: { 
        difficulty: 'mediu',
        duration_minutes: 25,
        has_video: true,
        rating: 4.7,
        views: 120
      }
    },
    {
      title: 'Cum să creați rapoarte personalizate cu filtre avansate',
      description: 'Învățați cum să dezvoltați rapoarte personalizate complexe utilizând constructorul de rapoarte din GeniusERP, cu accent pe filtrele avansate, calculele personalizate și vizualizările interactive.',
      category: CATEGORIES.TUTORIALE,
      tags: ['rapoarte', 'filtre', 'personalizare', 'vizualizare'],
      metadata: { 
        difficulty: 'avansat',
        duration_minutes: 40,
        has_video: true,
        rating: 4.8,
        views: 85
      }
    },
    {
      title: 'Reconciliere automată a extraselor bancare',
      description: 'Ghid pas cu pas pentru configurarea regulilor de reconciliere automată a extraselor bancare importate, incluzând potrivirea bazată pe referințe, sume și descrieri tranzacții.',
      category: CATEGORIES.TUTORIALE,
      tags: ['reconciliere', 'bancă', 'automatizare', 'extrase'],
      metadata: { 
        difficulty: 'începător',
        duration_minutes: 15,
        has_video: false,
        rating: 4.5,
        views: 210
      }
    }
  ];
  
  for (const threadData of threadsData) {
    const threadId = uuidv4();
    const now = new Date().toISOString();
    
    // Insert thread
    await client.query(
      `INSERT INTO collaboration_threads 
       (id, company_id, title, description, category, tags, metadata, 
        created_at, updated_at, created_by, last_message_at, is_private, is_closed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        threadId,
        COMPANY_ID,
        threadData.title,
        threadData.description,
        threadData.category,
        JSON.stringify(threadData.tags),
        JSON.stringify(threadData.metadata),
        now,
        now,
        ADMIN_USER_ID,
        now,
        false,
        false
      ]
    );
    
    console.log(`Created thread: ${threadData.title} (${threadData.category})`);
    
    // Add initial message for this thread
    const messageId = uuidv4();
    await client.query(
      `INSERT INTO collaboration_messages
       (id, thread_id, company_id, user_id, content, content_html, 
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        messageId,
        threadId,
        COMPANY_ID,
        ADMIN_USER_ID,
        threadData.description,
        `<p>${threadData.description}</p>`,
        now,
        now
      ]
    );
    
    // For questions, add a response to one of them
    if (threadData.category === CATEGORIES.INTREBARI && 
        threadData.title.includes('integra platforma de facturare')) {
      
      const replyId = uuidv4();
      const replyContent = 'Da, poți integra platforma de facturare electronică folosind modulul de Integrări. În secțiunea Setări > Integrări > API, configurează un nou endpoint cu URL-ul API-ului de facturare și setează credențialele necesare. După aceea, activează sincronizarea automată și selectează frecvența dorită.';
      
      await client.query(
        `INSERT INTO collaboration_messages
         (id, thread_id, company_id, user_id, content, content_html, 
          created_at, updated_at, reply_to_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          replyId,
          threadId,
          COMPANY_ID,
          ADMIN_USER_ID,
          replyContent,
          `<p>${replyContent}</p>`,
          now,
          now,
          messageId
        ]
      );
      
      // Update the thread's last_message_at
      await client.query(
        `UPDATE collaboration_threads 
         SET last_message_at = $1 
         WHERE id = $2`,
        [now, threadId]
      );
    }
  }
  
  console.log(`Successfully created ${threadsData.length} threads with messages`);
}

// Main function
async function main() {
  let client;
  try {
    client = await connectToDatabase();
    
    // Check if threads already exist to avoid duplicates
    const { rows } = await client.query('SELECT COUNT(*) as count FROM collaboration_threads');
    const threadCount = parseInt(rows[0].count);
    
    if (threadCount > 0) {
      console.log(`Database already contains ${threadCount} threads. Skipping insertion to avoid duplicates.`);
      console.log('If you want to add more data, first delete existing threads or modify this script.');
    } else {
      await createThreads(client);
      console.log('Successfully populated collaboration community data!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('Disconnected from database');
    }
  }
}

// Run the script
main();