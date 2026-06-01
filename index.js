import 'dotenv/config';
import app from './server/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[SERVER] Corriendo en puerto ${PORT}`);
});
