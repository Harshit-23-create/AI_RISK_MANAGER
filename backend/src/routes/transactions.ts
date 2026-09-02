import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listTransactions, getTransaction, createTransaction, getUserHistory } from '../controllers/transactionController';

const router = Router();
router.use(authenticate);

router.get('/', listTransactions);
router.post('/', createTransaction);
router.get('/user/:userId/history', getUserHistory);
router.get('/:transaction_id', getTransaction);

export default router;
