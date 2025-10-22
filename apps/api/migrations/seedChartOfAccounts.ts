/**
 * Romanian Chart of Accounts Seeder Script
 * 
 * This script parses the Romanian Chart of Accounts data and seeds the database
 * with the proper account class, group, synthetic, and analytic accounts
 * maintaining the relationships and account functions (A, P, B).
 */
import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from '../common/drizzle';

// Get the Drizzle ORM database client
const db = getDrizzle();
import { 
  accountClasses, 
  accountGroups, 
  syntheticAccounts, 
  analyticAccounts,
  accounts,
  insertAccountClassSchema,
  insertAccountGroupSchema,
  insertSyntheticAccountSchema,
  insertAnalyticAccountSchema,
} from "../../libs/shared/src/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse account classes from file
function parseAccountClasses(): { code: string; name: string; defaultAccountFunction: string }[] {
  const filePath = path.join(__dirname, '../../attached_assets/Clase de conturi.txt');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  const result: { code: string; name: string; defaultAccountFunction: string }[] = [];
  
  // Define all classes manually since the file structure is inconsistent
  // These are the standard 9 classes in Romanian accounting
  const classDefinitions = [
    { code: '1', name: 'Conturi de capitaluri, provizioane, împrumuturi şi datorii asimilate', defaultAccountFunction: 'P' },
    { code: '2', name: 'Conturi de imobilizări', defaultAccountFunction: 'A' },
    { code: '3', name: 'Conturi de stocuri şi producţie în curs de execuţie', defaultAccountFunction: 'A' },
    { code: '4', name: 'Conturi de terţi', defaultAccountFunction: 'B' },
    { code: '5', name: 'Conturi de trezorerie', defaultAccountFunction: 'A' },
    { code: '6', name: 'Conturi de cheltuieli', defaultAccountFunction: 'A' },
    { code: '7', name: 'Conturi de venituri', defaultAccountFunction: 'P' },
    { code: '8', name: 'Conturi speciale', defaultAccountFunction: 'B' },
    { code: '9', name: 'Conturi de gestiune', defaultAccountFunction: 'B' }
  ];
  
  return classDefinitions;
}

// Function to parse account groups from file
function parseAccountGroups(): { code: string; name: string; parentCode: string }[] {
  const filePath = path.join(__dirname, '../../attached_assets/Grupe de conturi.txt');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const result: { code: string; name: string; parentCode: string }[] = [];
  
  // The Grupe de conturi.txt file contains a single line with all groups
  // Parse the groups by splitting by numbers followed by dots
  const entries = fileContent.split(/(?=\d{2}\.\s)/);
  
  for (const entry of entries) {
    if (!entry.trim()) continue;
    
    // Extract the group code (XX) and name
    const match = entry.match(/^(\d{2})\.?\s+(.*?)(?=\d{2}\.|$)/s);
    if (match) {
      const code = match[1];
      const name = match[2].trim();
      const parentCode = code.charAt(0); // First digit is the class code
      
      result.push({ code, name, parentCode });
    }
  }
  
  console.log(`Parsed ${result.length} account groups from file`);
  return result;
}

// Parse and define the account classes and groups
const accountClassMap = parseAccountClasses();
const accountGroupMap = parseAccountGroups();

// Parse account function from text (A), (P), or (A/P) to standard formats A, P, B
function parseAccountFunction(text: string | null): 'A' | 'P' | 'B' | null {
  if (!text) return null;
  
  if (text.includes('(A/P)') || text.includes('(B)')) {
    return 'B';
  } else if (text.includes('(A)')) {
    return 'A';
  } else if (text.includes('(P)')) {
    return 'P';
  }
  
  return null;
}

// Parse the account code from the beginning of a line (e.g. "101. Capital" -> "101")
function parseAccountCode(line: string): string | null {
  const match = line.match(/^(\d+)\.?\s/);
  return match ? match[1] : null;
}

interface AccountEntry {
  code: string;
  name: string;
  accountFunction: 'A' | 'P' | 'B';
  level: 'class' | 'group' | 'synthetic' | 'analytic';
  parentCode?: string;
  grade?: number;
}

async function parseChartOfAccounts(dbInstance?: any): Promise<AccountEntry[]> {
  // First let's extract from MD file which has cleaner structure
  const mdFilePath = path.join(__dirname, '../../attached_assets/Planul de conturi 2025.md');
  
  // Read the MD file
  const mdContent = fs.readFileSync(mdFilePath, 'utf8');
  
  // Use the class files as text sources
  const classFiles = [
    'Pasted-Clasa-1-Conturi-de-capitaluri-provizioane-mprumuturi-i-datorii-asimilate-10-Capital-i-reserve-1743511205797.txt',
    'Pasted-Clasa-2-Conturi-de-imobiliz-ri-20-IMOBILIZ-RI-NECORPORALE-201-Cheltuieli-de-constituire-A-203--1743511869171.txt',
    'Pasted-Clasa-3-Conturi-de-stocuri-i-produc-ie-n-curs-de-execu-ie-30-Stocuri-de-materii-prime-i-materia-1743512109496.txt',
    'Pasted-Clasa-4-Conturi-de-ter-i-40-Furnizori-i-conturi-asimilate-401-Furnizori-P-403-Efecte-de-pl-ti-1743512302323.txt',
    'Pasted-Clasa-5-Conturi-de-trezorerie-50-Investi-ii-pe-termen-scurt-501-Ac-iuni-de-inute-la-entit-ile-af-1743512586595.txt',
    'Pasted-Clasa-6-Conturi-de-cheltuieli-60-Cheltuieli-privind-stocurile-i-alte-consumuri-601-Cheltuieli-cu-1743512731449.txt',
    'Pasted-Clasa-7-Conturi-de-venituri-70-Cifra-de-afaceri-net-701-Venituri-din-v-nzarea-produselor-finite--1743513040153.txt',
    'Pasted-Clasa-9-Conturi-de-gestiune-90-Decontari-interne-901-Decontari-interne-privind-cheltuielile-1743654321.txt'
  ];
  
  // Combine all text content
  let txtContent = '';
  for (const classFile of classFiles) {
    try {
      const filePath = path.join(__dirname, '../../attached_assets/', classFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        txtContent += content + '\n';
      }
    } catch (err) {
      console.log(`Could not read class file: ${classFile}`);
    }
  }
  
  // Process files to extract as many accounts as possible
  const accounts: AccountEntry[] = [];
  const accountCodeSet = new Set<string>(); // To avoid duplicates
  
  // Add class accounts directly (most reliable)
  for (const classInfo of accountClassMap) {
    accounts.push({
      code: classInfo.code,
      name: classInfo.name,
      accountFunction: classInfo.defaultAccountFunction as 'A' | 'P' | 'B',
      level: 'class'
    });
    accountCodeSet.add(classInfo.code);
  }
  
  // First pass: Get all accounts we can from the cleaner MD file
  await parseFromMdFile(mdContent, accounts, accountCodeSet);
  
  // For any missing class 9 accounts, we have a specific file
  const class9FilePath = path.join(__dirname, '../../attached_assets/Chart of Accounts - Clasa 9.md');
  if (fs.existsSync(class9FilePath)) {
    const class9Content = fs.readFileSync(class9FilePath, 'utf8');
    await parseFromMdFile(class9Content, accounts, accountCodeSet);
  }
  
  // If we find more accounts in the txt file that weren't in the MD, add those too
  await parseFromTxtFile(txtContent, accounts, accountCodeSet);
  
  // Add any missing accounts from the current database, since we know the database is correct
  const dbToUse = dbInstance; // Use the passed dbInstance
  await addMissingAccountsFromDb(accounts, accountCodeSet, dbToUse);
  
  // Sort accounts by code for easier debugging
  accounts.sort((a, b) => a.code.localeCompare(b.code));
  
  return accounts;
}

async function parseFromMdFile(content: string, accounts: AccountEntry[], accountCodeSet: Set<string>) {
  const lines = content.split('\n');
  
  // Improved regular expressions for more accurate parsing of MD file format
  const classHeaderRegex = /Clasa\s+(\d+)\s*-\s*(.+)/i;
  // This regex is designed to handle account entries with or without function indicators
  const accountRegex = /^(\d+)\.?\s+([^(]+)(?:\s*\(([A-Za-z\/]+)\))?/;
  // A more aggressive pattern to catch accounts that might be in unusual formats
  const alternateAccountRegex = /(\d{3,4})[\.|\s]+([^(0-9][^(]*?)(?:\s*\(([A-Za-z\/]+)\))?(?=$|\d{2,4}\.|\s*\d{2,4}\s)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this is a class header first
    const classMatch = line.match(classHeaderRegex);
    if (classMatch) {
      continue; // We've already added classes manually
    }
    
    // Try the primary account regex first
    let match = line.match(accountRegex);
    
    // If that fails, try the alternate pattern
    if (!match) {
      match = line.match(alternateAccountRegex);
    }
    
    if (!match) continue;
    
    const code = match[1];
    const name = match[2].trim();
    const functionInParens = match[3] || '';
    
    // Skip if no valid code or name, or if we already have this code
    if (!code || !name || accountCodeSet.has(code)) continue;
    
    // Skip codes that are clearly not account codes
    if (code.length > 6) continue;
    
    // Process the account and add it to our list
    processAccount(code, name, functionInParens, accounts, accountCodeSet);
  }
}

async function parseFromTxtFile(content: string, accounts: AccountEntry[], accountCodeSet: Set<string>) {
  const lines = content.split('\n');
  
  // More aggressive regex patterns to catch accounts in the text file
  const accountRegex = /^(\d{2,4})\.?\s+([^(0-9][^(]*?)(?:\s*\(([A-Za-z\/]+)\))?/;
  const embeddedAccountRegex = /(\d{3,4})\.?\s+([^(0-9][^(]*?)(?:\s*\(([A-Za-z\/]+)\))?(?=$|\d{2,4}\.|\s*\d{2,4}\s)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // First try the standard pattern
    const match = line.match(accountRegex);
    if (match) {
      const code = match[1];
      const name = match[2].trim();
      const functionInParens = match[3] || '';
      
      // Process the account if we don't already have it
      if (!accountCodeSet.has(code)) {
        processAccount(code, name, functionInParens, accounts, accountCodeSet);
      }
    }
    
    // Then look for multiple accounts embedded in a single line
    let embeddedMatch;
    while ((embeddedMatch = embeddedAccountRegex.exec(line)) !== null) {
      const code = embeddedMatch[1];
      const name = embeddedMatch[2].trim();
      const functionInParens = embeddedMatch[3] || '';
      
      // Process the account if we don't already have it
      if (!accountCodeSet.has(code)) {
        processAccount(code, name, functionInParens, accounts, accountCodeSet);
      }
    }
  }
}

async function addMissingAccountsFromDb(accounts: AccountEntry[], accountCodeSet: Set<string>, dbInstance?: any) {
  // Query all synthetic accounts in the database
  const dbToUse = dbInstance || db;
  const dbAccounts = await dbToUse.select().from(syntheticAccounts)
    .leftJoin(accountGroups, eq(syntheticAccounts.groupId, accountGroups.id))
    .leftJoin(accountClasses, eq(accountGroups.classId, accountClasses.id));
  
  for (const entry of dbAccounts) {
    const synthetic = entry.synthetic_accounts;
    if (!synthetic || accountCodeSet.has(synthetic.code)) continue;
    
    // Determine the account level and parent
    const level: 'class' | 'group' | 'synthetic' = 'synthetic';
    let parentCode = '';
    const grade = synthetic.grade;
    
    if (synthetic.code.length === 3) {
      parentCode = synthetic.code.substring(0, 2);
    } else if (synthetic.code.length === 4) {
      parentCode = synthetic.code.substring(0, 3);
    }
    
    // Add this account to our list
    accounts.push({
      code: synthetic.code,
      name: synthetic.name,
      accountFunction: synthetic.accountFunction as 'A' | 'P' | 'B',
      level,
      parentCode,
      grade
    });
    accountCodeSet.add(synthetic.code);
  }
}

function processAccount(code: string, name: string, functionInParens: string, accounts: AccountEntry[], accountCodeSet: Set<string>) {
  // Determine account level based on code length
  let level: 'class' | 'group' | 'synthetic' | 'analytic';
  let parentCode = '';
  let grade = 0;
  
  if (code.length === 1) {
    // This is a class, already handled manually
    return;
  } else if (code.length === 2) {
    level = 'group';
    parentCode = code.charAt(0);
  } else if (code.length === 3) {
    level = 'synthetic';
    parentCode = code.substring(0, 2);
    grade = 1; // Grade 1 synthetic account (3 digits)
  } else if (code.length === 4) {
    // All 4-digit accounts are grade 2 synthetic accounts
    level = 'synthetic';
    parentCode = code.substring(0, 3);
    grade = 2; // Grade 2 synthetic account (4 digits)
  } else {
    // Any code with 5 or more digits is an analytic account
    level = 'analytic';
    // The parent is the first 4 digits (grade 2 synthetic)
    parentCode = code.substring(0, 4);
  }
  
  // Determine account function
  let accountFunction: 'A' | 'P' | 'B';
  
  // Parse the function directly from the text if available
  if (functionInParens) {
    if (functionInParens.includes('A/P') || functionInParens.includes('B')) {
      accountFunction = 'B';
    } else if (functionInParens.includes('A')) {
      accountFunction = 'A';
    } else if (functionInParens.includes('P')) {
      accountFunction = 'P';
    } else {
      // If function is specified but not recognized, inherit from parent
      accountFunction = inheritAccountFunction(accounts, parentCode) || 'B';
    }
  } else {
    // No function specified, inherit from parent
    accountFunction = inheritAccountFunction(accounts, parentCode) || 'B';
  }
  
  // Add to accounts array and track that we've added this code
  accounts.push({
    code,
    name,
    accountFunction,
    level,
    parentCode,
    grade: grade > 0 ? grade : undefined
  });
  accountCodeSet.add(code);
}

// Helper function to inherit account function from parent
function inheritAccountFunction(accounts: AccountEntry[], parentCode: string): 'A' | 'P' | 'B' | null {
  if (!parentCode) return null;
  
  // Try to find the parent account
  const parentAccount = accounts.find(a => a.code === parentCode);
  if (parentAccount) {
    return parentAccount.accountFunction;
  }
  
  // If we can't find the direct parent, try to inherit from a higher level
  if (parentCode.length > 1) {
    return inheritAccountFunction(accounts, parentCode.substring(0, parentCode.length - 1));
  }
  
  return null;
}

async function seedAccountClasses(dbInstance: any) {
  console.log('Seeding account classes...');
  
  for (const classInfo of accountClassMap) {
    await dbInstance.insert(accountClasses).values({
      code: classInfo.code,
      name: classInfo.name,
      defaultAccountFunction: classInfo.defaultAccountFunction,
      description: `Romanian Chart of Accounts - Class ${classInfo.code}`
    }).onConflictDoNothing({ target: accountClasses.code });
  }
  
  console.log('Account classes seeded successfully');
}

async function seedAccountGroups(dbInstance: any) {
  console.log('Seeding account groups...');
  
  const classMap = new Map();
  
  // First, get all the account classes to map their IDs
  const dbClasses = await dbInstance.select().from(accountClasses);
  for (const cls of dbClasses) {
    classMap.set(cls.code, cls.id);
  }
  
  // Then seed the groups using the parsed account group data
  for (const group of accountGroupMap) {
    const classId = classMap.get(group.parentCode);
    
    if (classId) {
      await dbInstance.insert(accountGroups).values({
        classId: classId,
        code: group.code,
        name: group.name,
        description: `Romanian Chart of Accounts - Group ${group.code}`
      }).onConflictDoNothing({ target: accountGroups.code });
    }
  }
  
  console.log('Account groups seeded successfully');
}

async function seedSyntheticAccounts(accountEntries: AccountEntry[], dbInstance: any) {
  console.log('Seeding synthetic accounts...');
  
  const groupMap = new Map();
  const syntheticMap = new Map();
  
  // Get all the account groups to map their IDs
  const dbGroups = await dbInstance.select().from(accountGroups);
  for (const group of dbGroups) {
    groupMap.set(group.code, group.id);
  }
  
  console.log(`Found ${dbGroups.length} account groups in the database`);
  
  // Seed grade 1 synthetic accounts first (3 digits)
  const grade1Entries = accountEntries.filter(e => e.level === 'synthetic' && e.grade === 1);
  console.log(`Found ${grade1Entries.length} grade 1 synthetic accounts to seed`);
  
  let successCount = 0;
  
  for (const synthetic of grade1Entries) {
    try {
      const groupId = groupMap.get(synthetic.parentCode);
      
      if (groupId) {
        const id = uuidv4();
        syntheticMap.set(synthetic.code, id);
        
        await dbInstance.insert(syntheticAccounts).values({
          id,
          groupId: groupId,
          code: synthetic.code,
          name: synthetic.name,
          accountFunction: synthetic.accountFunction,
          grade: 1,
          description: `Romanian Chart of Accounts - Synthetic Account ${synthetic.code}`
        }).onConflictDoNothing({ target: syntheticAccounts.code });
        
        successCount++;
      } else {
        console.log(`No groupId found for synthetic account ${synthetic.code} with parent ${synthetic.parentCode}`);
      }
    } catch (error) {
      console.error(`Error inserting synthetic account ${synthetic.code}:`, error);
    }
  }
  
  console.log(`Successfully inserted ${successCount} grade 1 synthetic accounts`);
  
  // Then seed grade 2 synthetic accounts (4 digits)
  const grade2Entries = accountEntries.filter(e => e.level === 'synthetic' && e.grade === 2);
  console.log(`Found ${grade2Entries.length} grade 2 synthetic accounts to seed`);
  
  let grade2SuccessCount = 0;
  let grade2ErrorCount = 0;
  
  for (const synthetic of grade2Entries) {
    try {
      // For grade 2 synthetic accounts, we'll get the group ID from the first 2 digits
      const groupCode = synthetic.code.substring(0, 2);
      const [group] = await dbInstance
        .select({ id: accountGroups.id })
        .from(accountGroups)
        .where(eq(accountGroups.code, groupCode));
      
      if (!group?.id) {
        console.log(`No group ID found for synthetic account ${synthetic.code} with group code ${groupCode}`);
        continue;
      }
      
      // Find a parent synthetic account (3-digit account)
      // The first 3 digits of a 4-digit account should be the parent synthetic
      const syntheticCode = synthetic.code.substring(0, 3);
      const [parentSynthetic] = await dbInstance
        .select({ id: syntheticAccounts.id })
        .from(syntheticAccounts)
        .where(eq(syntheticAccounts.code, syntheticCode));
      
      // Create the base values for the insert
      const insertValues: any = {
        id: uuidv4(),
        groupId: group.id,
        code: synthetic.code,
        name: synthetic.name,
        accountFunction: synthetic.accountFunction,
        grade: 2,
        description: `Romanian Chart of Accounts - Synthetic Account ${synthetic.code}`
      };
      
      // Add parentId only if we found a valid synthetic parent
      if (parentSynthetic?.id) {
        insertValues.parentId = parentSynthetic.id;
      } else {
        console.log(`No parent synthetic account found for ${synthetic.code}, leaving parentId null`);
      }
      
      await dbInstance.insert(syntheticAccounts).values(insertValues)
        .onConflictDoNothing({ target: syntheticAccounts.code });
      
      grade2SuccessCount++;
    } catch (error) {
      console.error(`Error inserting grade 2 synthetic account ${synthetic.code}:`, error);
      grade2ErrorCount++;
    }
  }
  
  console.log(`Successfully inserted ${grade2SuccessCount} grade 2 synthetic accounts`);
  if (grade2ErrorCount > 0) {
    console.log(`Failed to insert ${grade2ErrorCount} grade 2 synthetic accounts due to errors`);
  }
  
  console.log('Synthetic accounts seeded successfully');
}

async function getGroupIdForSynthetic(syntheticCode: string, dbInstance: any): Promise<string | undefined> {
  // Get the group code from the synthetic code (first 2 digits)
  const groupCode = syntheticCode.substring(0, 2);
  
  // Get the group ID from the database
  const [group] = await dbInstance
    .select({ id: accountGroups.id })
    .from(accountGroups)
    .where(eq(accountGroups.code, groupCode));
    
  return group?.id;
}

async function seedAnalyticAccounts(accountEntries: AccountEntry[], dbInstance: any) {
  console.log('Seeding analytic accounts...');
  
  const syntheticMap = new Map();
  
  // Get all the synthetic accounts to map their IDs
  const dbSynthetics = await dbInstance.select().from(syntheticAccounts);
  for (const synthetic of dbSynthetics) {
    syntheticMap.set(synthetic.code, synthetic.id);
  }
  
  console.log(`Found ${dbSynthetics.length} synthetic accounts in the database`);
  
  // Seed analytic accounts
  const analyticEntries = accountEntries.filter(e => e.level === 'analytic');
  console.log(`Found ${analyticEntries.length} analytic accounts to seed`);
  
  let successCount = 0;
  const createdAnalyticIds = new Map();
  
  // First, try to seed accounts with synthetic parents (proper structure)
  for (const analytic of analyticEntries) {
    try {
      // Skip if parentCode is undefined
      if (!analytic.parentCode) {
        console.log(`Skipping analytic account ${analytic.code} with no parent code`);
        continue;
      }
      
      // For analytic accounts, try to find the best matching parent
      let parentCode = analytic.parentCode;
      let syntheticId = syntheticMap.get(parentCode);
      
      // If we can't find a direct match, try some fallbacks
      if (!syntheticId) {
        // For 4-digit code with no parent, try the 3-digit parent
        if (parentCode.length === 4) {
          const threeDigitParent = parentCode.substring(0, 3);
          syntheticId = syntheticMap.get(threeDigitParent);
          if (syntheticId) {
            console.log(`Found 3-digit parent ${threeDigitParent} for analytic account ${analytic.code}`);
            parentCode = threeDigitParent;
          }
        }
        
        // For 3-digit code with no parent, see if there's a 3-digit synthetic
        else if (parentCode.length === 3 && !syntheticId) {
          // Try adding a 0 to see if there's a standard 4-digit synthetic
          syntheticId = syntheticMap.get(parentCode + '0');
          if (syntheticId) {
            console.log(`Found grade 2 synthetic parent ${parentCode}0 for analytic account ${analytic.code}`);
            parentCode = parentCode + '0';
          }
        }
      }
      
      if (syntheticId) {
        const id = uuidv4();
        createdAnalyticIds.set(analytic.code, id);
        
        await dbInstance.insert(analyticAccounts).values({
          id,
          syntheticId: syntheticId,
          code: analytic.code,
          name: analytic.name,
          accountFunction: analytic.accountFunction,
          description: `Romanian Chart of Accounts - Analytic Account ${analytic.code}`
        }).onConflictDoNothing({ target: analyticAccounts.code });
        
        successCount++;
      } else {
        console.log(`No valid synthetic parent found for analytic account ${analytic.code} with parent ${parentCode}`);
      }
    } catch (error) {
      console.error(`Error inserting analytic account ${analytic.code}:`, error);
    }
  }
  
  console.log(`Successfully inserted ${successCount} analytic accounts`);
  console.log('Analytic accounts seeded successfully');
}

async function seedLegacyAccounts(dbInstance: any) {
  console.log('Seeding legacy accounts table for compatibility...');
  
  // First, get all the analytic accounts
  const dbAnalytics = await dbInstance.select().from(analyticAccounts)
    .leftJoin(syntheticAccounts, eq(analyticAccounts.syntheticId, syntheticAccounts.id))
    .leftJoin(accountGroups, eq(syntheticAccounts.groupId, accountGroups.id))
    .leftJoin(accountClasses, eq(accountGroups.classId, accountClasses.id));
  
  console.log(`Found ${dbAnalytics.length} analytic accounts with joins to seed in legacy table`);
  
  let successCount = 0;
  
  // Now create or update the legacy accounts table entries
  for (const entry of dbAnalytics) {
    try {
      const analytic = entry.analytic_accounts;
      const synthetic = entry.synthetic_accounts;
      const group = entry.account_groups;
      const accountClass = entry.account_classes;
      
      if (analytic && synthetic && group && accountClass) {
        await dbInstance.insert(accounts).values({
          analyticId: analytic.id,
          syntheticId: synthetic.id,
          classId: accountClass.id,
          code: analytic.code,
          name: analytic.name,
          type: analytic.accountFunction,
          description: analytic.description,
          isActive: true
        }).onConflictDoNothing({ target: accounts.code });
        
        successCount++;
      } else {
        console.log(`Missing related data for account ${analytic?.code || 'unknown'}: analytic=${!!analytic}, synthetic=${!!synthetic}, group=${!!group}, class=${!!accountClass}`);
      }
    } catch (error) {
      console.error(`Error inserting legacy account:`, error);
    }
  }
  
  console.log(`Successfully inserted ${successCount} legacy accounts`);
  console.log('Legacy accounts seeded successfully');
}

export async function seedChartOfAccounts(database?: any) {
  // Use the provided database if available, otherwise create a new DrizzleService instance
  let dbInstance;
  
  if (database) {
    dbInstance = database;
  } else {
    dbInstance = getDrizzle();
  }
  try {
    console.log('Starting Romanian Chart of Accounts seeding...');
    
    // Parse the Chart of Accounts file
    const accountEntries = await parseChartOfAccounts(dbInstance);
    
    // Debug logs to see what was parsed
    const syntheticEntries = accountEntries.filter(e => e.level === 'synthetic');
    const grade1Entries = syntheticEntries.filter(e => e.grade === 1);
    const grade2Entries = syntheticEntries.filter(e => e.grade === 2);
    const analyticEntries = accountEntries.filter(e => e.level === 'analytic');
    
    console.log(`Parsed ${accountEntries.length} total account entries`);
    console.log(`Parsed ${syntheticEntries.length} synthetic accounts (${grade1Entries.length} grade 1, ${grade2Entries.length} grade 2)`);
    console.log(`Parsed ${analyticEntries.length} analytic accounts`);
    
    // Enhanced debugging for account classes
    const classEntries = accountEntries.filter(e => e.level === 'class');
    console.log(`Parsed ${classEntries.length} account classes`);
    console.log('Classes:', classEntries.map(c => c.code + ': ' + c.name).join(', '));
    
    // Enhanced debugging for account groups
    const groupEntries = accountEntries.filter(e => e.level === 'group');
    console.log(`Parsed ${groupEntries.length} account groups`);
    
    // Check specifically for Class 9 entries
    const class9Entries = syntheticEntries.filter(e => e.code.startsWith('9'));
    console.log(`Parsed ${class9Entries.length} Class 9 accounts`);
    if (class9Entries.length > 0) {
      console.log('Class 9 accounts:', class9Entries.map(e => e.code + ': ' + e.name).join(', '));
    }
    
    // Debug - show first few accounts of each type
    const grade1Examples = grade1Entries.slice(0, 3).map(e => `${e.code}: ${e.name}`);
    const grade2Examples = grade2Entries.slice(0, 3).map(e => `${e.code}: ${e.name}`);
    const analyticExamples = analyticEntries.slice(0, 3).map(e => `${e.code}: ${e.name}`);
    
    console.log(`Grade 1 examples: ${grade1Examples.join(', ')}`);
    console.log(`Grade 2 examples: ${grade2Examples.join(', ')}`);
    console.log(`Analytic examples: ${analyticExamples.join(', ')}`);
    
    // Seed in order of hierarchy
    await seedAccountClasses(dbInstance);
    await seedAccountGroups(dbInstance);
    await seedSyntheticAccounts(accountEntries, dbInstance);
    await seedAnalyticAccounts(accountEntries, dbInstance);
    
    // Seed the legacy accounts table for compatibility
    await seedLegacyAccounts(dbInstance);
    
    console.log('Romanian Chart of Accounts seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding Chart of Accounts:', error);
    return false;
  }
}

// ESM modules don't have require.main === module
// Instead check if this is the main module being executed directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  seedChartOfAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to seed Chart of Accounts:', error);
      process.exit(1);
    });
}