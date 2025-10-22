import { db } from '../db';
import { syntheticAccounts } from '../../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

/**
 * Script to add missing synthetic accounts from Class 1
 * Based on the provided file in attached_assets
 */

const missingAccounts = [
  {
    code: '1011',
    name: 'Capital subscris nevărsat',
    accountFunction: 'P',
    grade: 2,
    groupId: '870ec668-7432-408e-bf49-8b1fd3555045', // Group 10
  },
  {
    code: '1015',
    name: 'Patrimoniul regiei',
    accountFunction: 'P',
    grade: 2,
    groupId: '870ec668-7432-408e-bf49-8b1fd3555045', // Group 10
  },
  {
    code: '1031',
    name: 'Beneficii acordate angajaţilor sub forma instrumentelor de capitaluri proprii',
    accountFunction: 'P',
    grade: 2,
    groupId: '870ec668-7432-408e-bf49-8b1fd3555045', // Group 10
  },
  {
    code: '1044',
    name: 'Prime de conversie a obligaţiunilor în acţiuni',
    accountFunction: 'P',
    grade: 2,
    groupId: '870ec668-7432-408e-bf49-8b1fd3555045', // Group 10
  },
  {
    code: '1495',
    name: 'Pierderi rezultate din reorganizări',
    accountFunction: 'A',
    grade: 2,
    groupId: 'cb712ed6-202a-4310-a70f-f24802cc8623', // Group 14
  },
  {
    code: '1496',
    name: 'Pierderi rezultate din reorganizări de societăţi',
    accountFunction: 'A',
    grade: 2,
    groupId: 'cb712ed6-202a-4310-a70f-f24802cc8623', // Group 14
  },
  {
    code: '1498',
    name: 'Alte pierderi legate de instrumentele de capitaluri proprii',
    accountFunction: 'A',
    grade: 2,
    groupId: 'cb712ed6-202a-4310-a70f-f24802cc8623', // Group 14
  },
  {
    code: '1512',
    name: 'Provizioane pentru garanţii acordate clienţilor',
    accountFunction: 'P',
    grade: 2,
    groupId: '7a989227-9a51-4012-8b36-ccaaafe27784', // Group 15
  },
  {
    code: '1514',
    name: 'Provizioane pentru restructurare',
    accountFunction: 'P',
    grade: 2,
    groupId: '7a989227-9a51-4012-8b36-ccaaafe27784', // Group 15
  },
  {
    code: '1515',
    name: 'Provizioane pentru pensii şi obligaţii similare',
    accountFunction: 'P',
    grade: 2,
    groupId: '7a989227-9a51-4012-8b36-ccaaafe27784', // Group 15
  },
  {
    code: '1516',
    name: 'Provizioane pentru impozite',
    accountFunction: 'P',
    grade: 2,
    groupId: '7a989227-9a51-4012-8b36-ccaaafe27784', // Group 15
  },
  {
    code: '1685',
    name: 'Dobânzi aferente datoriilor faţă de entităţile afiliate',
    accountFunction: 'P',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  {
    code: '1686',
    name: 'Dobânzi aferente datoriilor faţă de entităţile asociate şi entităţile controlate în comun',
    accountFunction: 'P',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  {
    code: '1687',
    name: 'Dobânzi aferente altor împrumuturi şi datorii asimilate',
    accountFunction: 'P',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  {
    code: '1691',
    name: 'Prime privind rambursarea obligaţiunilor',
    accountFunction: 'A',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  {
    code: '1692',
    name: 'Prime privind rambursarea altor datorii',
    accountFunction: 'A',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  // Additional accounts not mentioned in the data we extracted
  {
    code: '1051',
    name: 'Rezerve din reevaluare',
    accountFunction: 'P',
    grade: 2,
    groupId: '870ec668-7432-408e-bf49-8b1fd3555045', // Group 10
  },
  {
    code: '1671',
    name: 'Alte împrumuturi şi datorii asimilate',
    accountFunction: 'P',
    grade: 2,
    groupId: '278bf79d-081d-4bc8-bdda-1a4df58c1c55', // Group 16
  },
  {
    code: '1211',
    name: 'Profit sau pierdere',
    accountFunction: 'B',
    grade: 2,
    groupId: '105da8d9-f558-45b3-babe-b2df6db97e87', // Group 12
  },
  {
    code: '1291',
    name: 'Repartizarea profitului',
    accountFunction: 'A',
    grade: 2,
    groupId: '105da8d9-f558-45b3-babe-b2df6db97e87', // Group 12
  }
];

async function addMissingClass1Accounts() {
  console.log('Starting to add missing Class 1 accounts...');
  
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
      
      // Insert the account
      await db.insert(syntheticAccounts).values({
        id: uuidv4(),
        code: account.code,
        name: account.name,
        accountFunction: account.accountFunction,
        grade: account.grade,
        groupId: account.groupId,
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