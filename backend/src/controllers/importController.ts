import { Request, Response } from 'express';
import { ImportService } from '../services/importService';

const importService = new ImportService();

export const importCsv = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const report = await importService.processCsv(req.file.path);
    return res.status(200).json({ message: 'Import processed', report });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
