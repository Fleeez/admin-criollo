const express = require('express');
const webhookRouter = require('../src/routes/webhook');

const app = express();

app.use(express.json());

// Montar en '/' porque Vercel ya recorta '/api/webhook' antes de pasarlo a Express
app.use('/', webhookRouter);

module.exports = app;
