import { ImportService } from './services/importService';

async function main() {
  const service = new ImportService();
  const filePath = '/Users/ankanghosh/Downloads/expenses_export.csv';
  
  console.log('Running import pipeline on', filePath);
  
  try {
    const report = await service.processCsv(filePath);
    
    console.log(`\nImport complete. Processed ${report.totalRowsProcessed} rows.`);
    console.log('Anomalies by type:', report.anomaliesByType);
    
    console.log('\n--- ANOMALY REPORT ---');
    for (const anomaly of report.anomalies) {
      console.log(`Row ${anomaly.rowNum}: [${anomaly.anomaly_type}] - ${anomaly.description}`);
    }

  } catch (err) {
    console.error('Failed:', err);
  }
}

main();
