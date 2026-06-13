import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { importCsv } from './controllers/importController';

// Import new routers
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import settlementRoutes from './routes/settlementRoutes';
import balanceRoutes from './routes/balanceRoutes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/import', upload.single('file'), importCsv);

// Mount new routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
// Using mergeParams, we can mount these cleanly:
app.use('/api/groups/:id/settlements', settlementRoutes);
app.use('/api/groups/:id/balances', balanceRoutes);

app.listen(port, () => {
  console.log(`Kharchwise Backend listening on port ${port}`);
});
