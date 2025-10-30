/**
 * Export Romanian Chart of Accounts
 * 
 * This script exports all accounts from the database into a clean text file format
 * that can be used for proper seeding in the future.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '../src/db';
import {
  account_classes,
  account_groups,
  synthetic_accounts,
} from "@geniuserp/shared";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eq, asc, and, count, isNull } from 'drizzle-orm';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportChartOfAccounts() {
  try {
    console.log('Starting Romanian Chart of Accounts export...');
    
    // Get all classes
    const classes = await db.select().from(account_classes).orderBy(asc(account_classes.code));
    
    // File output
    let outputContent = 'Planul de conturi general Românesc\n\n';
    
    // Export each class
    for (const accountClass of classes) {
      outputContent += `Clasa ${accountClass.code} - ${accountClass.name} (${accountClass.default_account_function})\n\n`;
      
    // Get groups for this class
    const groups = await db.select().from(account_groups)
                           .where(eq(account_groups.class_id, accountClass.id))
                           .orderBy(asc(account_groups.code));
      
      // Export each group
      for (const group of groups) {
        outputContent += `${group.code}. ${group.name}\n`;
        
        // Get synthetic accounts (grade 1) for this group
        const syntheticG1 = await db.select().from(synthetic_accounts)
                                    .where(and(
                                      eq(synthetic_accounts.group_id, group.id),
                                      eq(synthetic_accounts.grade, 1)
                                    ))
                                 .orderBy(asc(synthetic_accounts.code));
        
        // Export each grade 1 synthetic account
        for (const synth1 of syntheticG1) {
          outputContent += `${synth1.code}. ${synth1.name} (${synth1.account_function})\n`;
          
          // Get synthetic accounts (grade 2) that have this as parent
          const syntheticG2 = await db.select().from(synthetic_accounts)
                                  .where(and(
                                    eq(synthetic_accounts.parent_id, synth1.id),
                                    eq(synthetic_accounts.grade, 2)
                                  ))
                                  .orderBy(asc(synthetic_accounts.code));
          
          // Export each grade 2 synthetic account
          for (const synth2 of syntheticG2) {
            outputContent += `${synth2.code}. ${synth2.name} (${synth2.account_function})\n`;
          }
        }
        
        // Get orphaned synthetic accounts (grade 2) for this group (no parent)
        const orphanedG2 = await db.select().from(synthetic_accounts)
                                  .where(and(
                                    eq(synthetic_accounts.group_id, group.id),
                                    eq(synthetic_accounts.grade, 2),
                                    isNull(synthetic_accounts.parent_id)
                                  ))
                                .orderBy(asc(synthetic_accounts.code));
        
        // Export orphaned grade 2 synthetic accounts
        for (const orphan of orphanedG2) {
          outputContent += `${orphan.code}. ${orphan.name} (${orphan.account_function})\n`;
        }
        
        outputContent += '\n';
      }
      
      outputContent += '\n';
    }
    
    // Write to file
    const filePath = path.join(__dirname, '../../attached_assets/Chart_of_Accounts_Export.txt');
    fs.writeFileSync(filePath, outputContent, 'utf8');
    
    // Count accounts
    const totalSynthetic = await db.select({ count: count() }).from(synthetic_accounts);
    
    console.log(`Exported ${totalSynthetic[0].count} accounts to ${filePath}`);
    console.log('Chart of Accounts export completed successfully');
    
    return true;
  } catch (error) {
    console.error('Error exporting Chart of Accounts:', error);
    return false;
  }
}

// ESM modules don't have require.main === module
// Instead check if this is the main module being executed directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  exportChartOfAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to export Chart of Accounts:', error);
      process.exit(1);
    });
}

export { exportChartOfAccounts };