/**
 * Export Romanian Chart of Accounts
 * 
 * This script exports all accounts from the database into a clean text file format
 * that can be used for proper seeding in the future.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { 
  accountClasses, 
  accountGroups, 
  syntheticAccounts,
} from "../../libs/shared/src/schema";
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
    const classes = await db.select().from(accountClasses).orderBy(asc(accountClasses.code));
    
    // File output
    let outputContent = 'Planul de conturi general Românesc\n\n';
    
    // Export each class
    for (const accountClass of classes) {
      outputContent += `Clasa ${accountClass.code} - ${accountClass.name} (${accountClass.defaultAccountFunction})\n\n`;
      
      // Get groups for this class
      const groups = await db.select().from(accountGroups)
                            .where(eq(accountGroups.classId, accountClass.id))
                            .orderBy(asc(accountGroups.code));
      
      // Export each group
      for (const group of groups) {
        outputContent += `${group.code}. ${group.name}\n`;
        
        // Get synthetic accounts (grade 1) for this group
        const syntheticG1 = await db.select().from(syntheticAccounts)
                                 .where(and(
                                    eq(syntheticAccounts.groupId, group.id),
                                    eq(syntheticAccounts.grade, 1)
                                 ))
                                 .orderBy(asc(syntheticAccounts.code));
        
        // Export each grade 1 synthetic account
        for (const synth1 of syntheticG1) {
          outputContent += `${synth1.code}. ${synth1.name} (${synth1.accountFunction})\n`;
          
          // Get synthetic accounts (grade 2) that have this as parent
          const syntheticG2 = await db.select().from(syntheticAccounts)
                                  .where(and(
                                    eq(syntheticAccounts.parentId, synth1.id),
                                    eq(syntheticAccounts.grade, 2)
                                  ))
                                  .orderBy(asc(syntheticAccounts.code));
          
          // Export each grade 2 synthetic account
          for (const synth2 of syntheticG2) {
            outputContent += `${synth2.code}. ${synth2.name} (${synth2.accountFunction})\n`;
          }
        }
        
        // Get orphaned synthetic accounts (grade 2) for this group (no parent)
        const orphanedG2 = await db.select().from(syntheticAccounts)
                                .where(and(
                                  eq(syntheticAccounts.groupId, group.id),
                                  eq(syntheticAccounts.grade, 2),
                                  isNull(syntheticAccounts.parentId)
                                ))
                                .orderBy(asc(syntheticAccounts.code));
        
        // Export orphaned grade 2 synthetic accounts
        for (const orphan of orphanedG2) {
          outputContent += `${orphan.code}. ${orphan.name} (${orphan.accountFunction})\n`;
        }
        
        outputContent += '\n';
      }
      
      outputContent += '\n';
    }
    
    // Write to file
    const filePath = path.join(__dirname, '../../attached_assets/Chart_of_Accounts_Export.txt');
    fs.writeFileSync(filePath, outputContent, 'utf8');
    
    // Count accounts
    const totalSynthetic = await db.select({ count: count() }).from(syntheticAccounts);
    
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