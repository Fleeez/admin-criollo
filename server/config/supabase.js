import { createClient } from '@supabase/supabase-js';

// Strips BOM (﻿) and whitespace that PowerShell sometimes adds when piping env vars
const clean = (s) => s?.trim().replace(/^﻿/, '') ?? '';

const supabase = createClient(
  clean(process.env.SUPABASE_URL),
  clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

export default supabase;
