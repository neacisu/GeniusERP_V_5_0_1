/**
 * Migration Script: Numerotare Retroactivă pentru Înregistrările Existente
 * 
 * Actualizează toate înregistrările din ledger_entries fără journal_number
 * cu numerotare secvențială conform OMFP 2634/2015
 */

import { getClient } from '../common/drizzle';
import { JournalNumberingService } from '../modules/accounting/services/journal-numbering.service';
import { LedgerEntryType } from '../modules/accounting/services/journal.service';

interface ExistingEntry {
  id: string;
  companyId: string;
  type: string;
  createdAt: Date;
  entryDate: Date | null;
  journalNumber: string | null;
}

async function migrateExistingJournalEntries() {
  console.log('🔄 Început migrare numerotare retroactivă...');
  
  const sql = getClient();
  const numberingService = new JournalNumberingService();
  
  try {
    // 1. Obține toate înregistrările fără journal_number
    console.log('📋 Obținere înregistrări existente fără numerotare...');
    
    const existingEntries: ExistingEntry[] = await sql`
      SELECT 
        id, 
        company_id as "companyId",
        type,
        created_at as "createdAt",
        entry_date as "entryDate",
        journal_number as "journalNumber"
      FROM ledger_entries 
      WHERE journal_number IS NULL 
      ORDER BY company_id, type, 
        COALESCE(entry_date, created_at), 
        created_at
    `;

    console.log(`📊 Găsite ${existingEntries.length} înregistrări pentru numerotare`);

    if (existingEntries.length === 0) {
      console.log('✅ Toate înregistrările au deja numerotare!');
      return;
    }

    // 2. Grupează pe companie și tip pentru numerotare secvențială
    const entriesByCompanyAndType = new Map<string, ExistingEntry[]>();
    
    for (const entry of existingEntries) {
      const key = `${entry.companyId}-${entry.type}`;
      if (!entriesByCompanyAndType.has(key)) {
        entriesByCompanyAndType.set(key, []);
      }
      entriesByCompanyAndType.get(key)!.push(entry);
    }

    console.log(`🏢 Găsite ${entriesByCompanyAndType.size} grupuri (companie-tip)`);

    // 3. Procesează fiecare grup
    let totalUpdated = 0;
    let errors = 0;

    for (const [groupKey, entries] of entriesByCompanyAndType) {
      const [companyId, type] = groupKey.split('-');
      
      console.log(`\n📝 Procesare grup: ${type} pentru compania ${companyId} (${entries.length} înregistrări)`);

      // Sortează după dată pentru numerotare cronologică
      entries.sort((a, b) => {
        const dateA = a.entryDate || a.createdAt;
        const dateB = b.entryDate || b.createdAt;
        return dateA.getTime() - dateB.getTime();
      });

      // Procesează pe ani pentru a respecta formatul AN/NUMĂR
      const entriesByYear = new Map<number, ExistingEntry[]>();
      
      for (const entry of entries) {
        const date = entry.entryDate || entry.createdAt;
        const year = date.getFullYear();
        
        if (!entriesByYear.has(year)) {
          entriesByYear.set(year, []);
        }
        entriesByYear.get(year)!.push(entry);
      }

      // Procesează fiecare an
      for (const [year, yearEntries] of entriesByYear) {
        console.log(`  📅 An ${year}: ${yearEntries.length} înregistrări`);

        for (let i = 0; i < yearEntries.length; i++) {
          const entry = yearEntries[i];
          const entryDate = entry.entryDate || entry.createdAt;

          try {
            // Generează numărul de jurnal
            const journalNumber = await numberingService.generateJournalNumber(
              companyId,
              entry.type as LedgerEntryType,
              entryDate
            );

            // Actualizează înregistrarea
            await sql`
              UPDATE ledger_entries 
              SET 
                journal_number = ${journalNumber},
                entry_date = COALESCE(entry_date, ${entryDate}),
                document_date = COALESCE(document_date, entry_date, ${entryDate}),
                updated_at = NOW()
              WHERE id = ${entry.id}
            `;

            totalUpdated++;
            
            if (i % 10 === 0 || i === yearEntries.length - 1) {
              console.log(`    ✓ ${i + 1}/${yearEntries.length} procesate`);
            }

          } catch (error) {
            console.error(`    ❌ Eroare la ${entry.id}:`, error);
            errors++;
          }
        }
      }
    }

    // 4. Raport final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPORT MIGRARE COMPLETĂ');
    console.log('='.repeat(60));
    console.log(`✅ Înregistrări actualizate: ${totalUpdated}`);
    console.log(`❌ Erori: ${errors}`);
    console.log(`📈 Rata de succes: ${((totalUpdated / (totalUpdated + errors)) * 100).toFixed(1)}%`);

    // 5. Validare finală - verifică că nu mai sunt înregistrări fără numerotare
    const remainingUnnumbered = await sql`
      SELECT COUNT(*) as count FROM ledger_entries 
      WHERE journal_number IS NULL
    `;

    const unnumberedCount = parseInt(remainingUnnumbered[0].count);
    
    console.log(`\n🔍 VALIDARE FINALĂ:`);
    console.log(`   Înregistrări fără numerotare: ${unnumberedCount}`);
    
    if (unnumberedCount === 0) {
      console.log('   ✅ SUCCES COMPLET - Toate înregistrările au numerotare!');
    } else {
      console.log('   ⚠️ Încă există înregistrări fără numerotare');
    }

    // 6. Statistici pe tip de jurnal
    console.log('\n📈 STATISTICI PE TIP JURNAL:');
    const statsByType = await sql`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(journal_number) as numbered,
        COUNT(*) - COUNT(journal_number) as unnumbered
      FROM ledger_entries 
      GROUP BY type
      ORDER BY count DESC
    `;

    statsByType.forEach(stat => {
      const coverage = ((stat.numbered / stat.count) * 100).toFixed(1);
      console.log(`   ${stat.type.padEnd(12)}: ${stat.numbered}/${stat.count} (${coverage}%)`);
    });

    console.log('\n🎯 MIGRARE COMPLETĂ!');

  } catch (error) {
    console.error('❌ Eroare critică în migrarea retroactivă:', error);
    throw error;
  }
}

/**
 * Script pentru resetarea numerotării (ATENȚIE: Destructiv!)
 */
async function resetJournalNumbering() {
  console.log('⚠️ ATENȚIE: Resetare numerotare jurnale...');
  
  const sql = getClient();
  
  try {
    // Resetează journal_number la NULL
    await sql`UPDATE ledger_entries SET journal_number = NULL`;
    
    // Resetează counters
    await sql`DELETE FROM document_counters WHERE counter_type = 'JOURNAL'`;
    
    console.log('🔄 Numerotarea a fost resetată complet');
    
  } catch (error) {
    console.error('❌ Eroare la resetare:', error);
    throw error;
  }
}

// Determină ce funcție să ruleze
const isMain = process.argv[1].endsWith('migrate-existing-journal-entries.ts');
if (isMain) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetJournalNumbering()
      .then(() => {
        console.log('🎉 Reset completat!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Eroare critică:', error);
        process.exit(1);
      });
  } else {
    migrateExistingJournalEntries()
      .then(() => {
        console.log('🎉 Migrare completată cu succes!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Eroare critică în migrare:', error);
        process.exit(1);
      });
  }
}

export { migrateExistingJournalEntries, resetJournalNumbering };
