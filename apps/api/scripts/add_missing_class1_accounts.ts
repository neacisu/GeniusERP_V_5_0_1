import { getDrizzle } from '@common/drizzle';
import { syntheticAccounts, PC_account_groups as account_groups } from '@geniuserp/shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

const db = getDrizzle();

/**
 * Script to add missing synthetic accounts from Class 1
 * Based on the provided file in attached_assets
 * 
 * SECURITATE: UUID-uri grupuri sunt obținute dinamic din DB, NU hardcodate
 */

const missingAccounts = [
  {
    code: '1011',
    name: 'Capital subscris nevărsat',
    accountFunction: 'P',
    grade: 2,
    groupCode: '10', // Va fi rezolvat la group ID din DB
  },
  {
    code: '1015',
    name: 'Patrimoniul regiei',
    accountFunction: 'P',
    grade: 2,
    groupCode: '10',
  },
  {
    code: '1031',
    name: 'Beneficii acordate angajaţilor sub forma instrumentelor de capitaluri proprii',
    accountFunction: 'P',
    grade: 2,
    groupCode: '10',
  },
  {
    code: '1044',
    name: 'Prime de conversie a obligaţiunilor în acţiuni',
    accountFunction: 'P',
    grade: 2,
    groupCode: '10',
  },
  {
    code: '1495',
    name: 'Pierderi rezultate din reorganizări',
    accountFunction: 'A',
    grade: 2,
    groupCode: '14',
  },
  {
    code: '1496',
    name: 'Pierderi rezultate din reorganizări de societăţi',
    accountFunction: 'A',
    grade: 2,
    groupCode: '14',
  },
  {
    code: '1498',
    name: 'Alte pierderi legate de instrumentele de capitaluri proprii',
    accountFunction: 'A',
    grade: 2,
    groupCode: '14',
  },
  {
    code: '1512',
    name: 'Provizioane pentru garanţii acordate clienţilor',
    accountFunction: 'P',
    grade: 2,
    groupCode: '15',
  },
  {
    code: '1514',
    name: 'Provizioane pentru restructurare',
    accountFunction: 'P',
    grade: 2,
    groupCode: '15',
  },
  {
    code: '1515',
    name: 'Provizioane pentru pensii şi obligaţii similare',
    accountFunction: 'P',
    grade: 2,
    groupCode: '15',
  },
  {
    code: '1516',
    name: 'Provizioane pentru impozite',
    accountFunction: 'P',
    grade: 2,
    groupCode: '15',
  },
  {
    code: '1685',
    name: 'Dobânzi aferente datoriilor faţă de entităţile afiliate',
    accountFunction: 'P',
    grade: 2,
    groupCode: '16',
  },
  {
    code: '1686',
    name: 'Dobânzi aferente datoriilor faţă de entităţile asociate şi entităţile controlate în comun',
    accountFunction: 'P',
    grade: 2,
    groupCode: '16',
  },
  {
    code: '1687',
    name: 'Dobânzi aferente altor împrumuturi şi datorii asimilate',
    accountFunction: 'P',
    grade: 2,
    groupCode: '16',
  },
  {
    code: '1691',
    name: 'Prime privind rambursarea obligaţiunilor',
    accountFunction: 'A',
    grade: 2,
    groupCode: '16',
  },
  {
    code: '1692',
    name: 'Prime privind rambursarea altor datorii',
    accountFunction: 'A',
    grade: 2,
    groupCode: '16',
  },
  // Additional accounts not mentioned in the data we extracted
  {
    code: '1051',
    name: 'Rezerve din reevaluare',
    accountFunction: 'P',
    grade: 2,
    groupCode: '10',
  },
  {
    code: '1671',
    name: 'Alte împrumuturi şi datorii asimilate',
    accountFunction: 'P',
    grade: 2,
    groupCode: '16',
  },
  {
    code: '1211',
    name: 'Profit sau pierdere',
    accountFunction: 'B',
    grade: 2,
    groupCode: '12',
  },
  {
    code: '1291',
    name: 'Repartizarea profitului',
    accountFunction: 'A',
    grade: 2,
    groupCode: '12',
  }
];

async function addMissingClass1Accounts() {
  console.log('Starting to add missing Class 1 accounts...');
  console.log('SECURITATE: Obțin UUID-uri grupuri din DB, NU hardcodate\n');
  
  // Obține toate grupurile din DB pentru mapping
  const groups = await db.select().from(account_groups);
  const groupCodeToId: Record<string, string> = {};
  
  for (const group of groups) {
    // Extrage codul grupului din nume (ex: "Group 10" -> "10")
    const match = group.name?.match(/Group (\d+)/);
    if (match) {
      groupCodeToId[match[1]] = group.id;
    }
  }
  
  console.log(`✓ Mapare grupuri găsite: ${Object.keys(groupCodeToId).length} grupuri\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const account of missingAccounts) {
    try {
      // Check if account already exists
      const [existingAccount] = await db
        .select()
        .from(syntheticAccounts)
        .where(eq(syntheticAccounts.code, account.code));
        
      if (existingAccount) {
        console.log(`Account ${account.code} already exists, skipping.`);
        continue;
      }
      
      // Rezolvă groupCode la groupId din DB
      const groupId = groupCodeToId[account.groupCode];
      if (!groupId) {
        console.error(`❌ Group ${account.groupCode} nu a fost găsit în DB pentru account ${account.code}`);
        errorCount++;
        continue;
      }
      
      // Insert the account
      await db.insert(syntheticAccounts).values({
        id: uuidv4(),
        code: account.code,
        name: account.name,
        accountFunction: account.accountFunction,
        grade: account.grade,
        group_id: groupId, // Rezolvat dinamic din DB, NU hardcodat
        description: `Romanian Chart of Accounts - Synthetic Account ${account.code}`
      });
      
      console.log(`Successfully inserted account ${account.code}: ${account.name}`);
      successCount++;
    } catch (error) {
      console.error(`Error inserting account ${account.code}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Added ${successCount} missing accounts with ${errorCount} errors.`);
}

// Run the function if this is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  addMissingClass1Accounts()
    .then(() => {
      console.log('Completed adding missing Class 1 accounts.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to add missing Class 1 accounts:', error);
      process.exit(1);
    });
}