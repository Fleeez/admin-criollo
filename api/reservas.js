import supabase from '../server/config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) {
    console.error('[API/reservas] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}
