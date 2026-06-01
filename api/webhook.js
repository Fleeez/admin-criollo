const express = require('express');
const webhookRouter = require('../src/routes/webhook');

const app = express();

app.use(express.json());

// Vercel pasa el path original al handler, por eso se monta en '/webhook'
// (el rewrite en vercel.json convierte /webhook → este archivo)
app.use('/webhook', webhookRouter);
// Soporte para acceso directo sin rewrite
app.use('/api/webhook', webhookRouter);

module.exports = app;
