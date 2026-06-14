import { ImportService } from './src/services/importService';

const service = new ImportService();
service.processCsv('/Users/ankanghosh/Downloads/expenses_export.csv', 1)
  .then(report => {
    console.log(JSON.stringify(report, null, 2));
  })
  .catch(console.error);
