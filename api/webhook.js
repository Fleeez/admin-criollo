import express from 'express';
import webhookRouter from '../server/routes/webhook.js';

const app = express();

app.use(express.json());

app.use('/webhook', webhookRouter);
app.use('/api/webhook', webhookRouter);

export default app;
