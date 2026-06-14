import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/requireAuth';
import { ImportService } from '../services/importService';
import fs from 'fs';
import path from 'path';

const router = Router({ mergeParams: true });
const upload = multer({ dest: 'uploads/' });

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'Invalid group ID' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const importService = new ImportService();
    const report = await importService.processCsv(req.file.path, groupId);

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Import successful', report });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Failed to process import' });
  }
});

export default router;
