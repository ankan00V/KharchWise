import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
// Import new routers
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import settlementRoutes from './routes/settlementRoutes';
import balanceRoutes from './routes/balanceRoutes';
import expenseRoutes from './routes/expenseRoutes';
import anomalyRoutes from './routes/anomalyRoutes';
import importRoutes from './routes/importRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());



// Mount new routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:id/anomalies', anomalyRoutes);
app.use('/api/groups/:id/import', importRoutes);
// Using mergeParams, we can mount these cleanly:
app.use('/api/groups/:id/settlements', settlementRoutes);
app.use('/api/groups/:id/balances', balanceRoutes);
app.use('/api/groups/:id/expenses', expenseRoutes);


app.listen(port, () => {
  console.log(`Kharchwise Backend listening on port ${port}`);
});
