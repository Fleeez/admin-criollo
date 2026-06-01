// Mock database & state management for Gestion de Criollo (Simulated Supabase & WhatsApp Cloud API)

const STORAGE_KEYS = {
  INTEGRATIONS: 'criollo_integrations',
  CONVERSATIONS: 'criollo_conversations',
  APPOINTMENTS: 'criollo_appointments'
};

const defaultIntegrations = {
  phoneId: '123456789012345',
  wabaId: '987654321098765',
  accessToken: 'EAAG_criollo_never_expires_token_mock_123456',
  appSecret: 'a1b2c3d4e5f6g7h8i9j0',
  verifyToken: 'criollo:verify_token_secure_123',
  supabaseUrl: 'https://criollo-project.supabase.co',
  supabaseAnonKey: 'sb.anon.key.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  calendarClientId: '789123456-google-oauth-client.apps.googleusercontent.com'
};

const defaultConversations = [
  {
    id: 'conv_1',
    name: 'Agustín',
    phone: '+54 9 11 1234-5678',
    lastMessage: 'Hola que tal',
    timestamp: '1 minuto',
    botActive: false, // Pausado (Human Intervention)
    unread: false,
    messages: [
      { id: 'm1_1', sender: 'ai', text: '¡Hola! Bienvenido a Criollo 🥩. ¿En qué te puedo ayudar hoy? Si querés reservar mesa, decime qué día y horario preferís.', time: '11:50', date: 'Miércoles 27 de Mayo' },
      { id: 'm1_2', sender: 'client', text: 'Me parece bien el slot de las 15:00', time: '11:55', date: 'Miércoles 27 de Mayo' },
      { id: 'm1_3', sender: 'ai', text: 'Perfecto, el slot de las 15:00 sigue disponible. Para confirmar tu cita:\n\n- 📅 Miércoles 27 de mayo a las 15:00\n- 🥩 Mesa para 2\n- 👤 Agustín (cliente nuevo)\n\n¿Confirmás la cita? 😉', time: '11:56', date: 'Miércoles 27 de Mayo' },
      { id: 'm1_4', sender: 'client', text: 'Si confirmo', time: '11:56', date: 'Miércoles 27 de Mayo' },
      { id: 'm1_5', sender: 'ai', text: '¡Cita confirmada, Agustín! 🎉\n\n- 📅 Miércoles 27 de mayo a las 15:00\n- 🥩 Reserva de mesa\n- 👤 Agustín\n\nSi necesitás cancelar o cambiar la cita, no dudes en escribirnos. ¡Hasta pronto! 😊', time: '11:56', date: 'Miércoles 27 de Mayo' },
      { id: 'm1_6', sender: 'human', text: 'Hola que tal', time: '11:57', date: 'Miércoles 27 de Mayo' }
    ]
  },
  {
    id: 'conv_2',
    name: 'María',
    phone: '+54 9 341 987-6543',
    lastMessage: 'Quiero reservar mesa para 4 personas por favor',
    timestamp: '2 horas',
    botActive: true,
    unread: true,
    messages: [
      { id: 'm2_1', sender: 'client', text: 'Hola, buenas tardes!', time: '14:20', date: 'Lunes 1 de Junio' },
      { id: 'm2_2', sender: 'ai', text: '¡Hola María! 👋 Bienvenidos a Criollo. ¿En qué puedo ayudarte hoy? Para reservar mesa, indicame la fecha, hora y cantidad de comensales.', time: '14:21', date: 'Lunes 1 de Junio' },
      { id: 'm2_3', sender: 'client', text: 'Quiero reservar mesa para 4 personas por favor', time: '14:22', date: 'Lunes 1 de Junio' }
    ]
  },
  {
    id: 'conv_3',
    name: 'Carlos Pérez',
    phone: '+54 9 261 444-5555',
    lastMessage: 'Muchas gracias por la confirmación',
    timestamp: '1 día',
    botActive: true,
    unread: false,
    messages: [
      { id: 'm3_1', sender: 'client', text: 'Hola, ¿tienen lugar para hoy a la noche?', time: '20:10', date: 'Domingo 31 de Mayo' },
      { id: 'm3_2', sender: 'ai', text: '¡Hola Carlos! Para hoy a la noche estamos al límite, pero tengo un lugar libre a las 22:30 para 2 personas. ¿Te gustaría agendarlo?', time: '20:12', date: 'Domingo 31 de Mayo' },
      { id: 'm3_3', sender: 'client', text: 'Buenísimo, reservame ese por favor.', time: '20:15', date: 'Domingo 31 de Mayo' },
      { id: 'm3_4', sender: 'ai', text: '¡Confirmado Carlos! Te agendamos para hoy a las 22:30 (Mesa para 2). ¡Te esperamos! 🥩', time: '20:16', date: 'Domingo 31 de Mayo' },
      { id: 'm3_5', sender: 'client', text: 'Muchas gracias por la confirmación', time: '20:18', date: 'Domingo 31 de Mayo' }
    ]
  }
];

const defaultAppointments = [
  { id: 'apt_1', name: 'Agustín', time: '15:00', date: '2026-05-27', guests: 2, status: 'completada', phone: '+54 9 11 1234-5678' },
  { id: 'apt_2', name: 'María', time: '21:30', date: '2026-06-01', guests: 4, status: 'pendiente', phone: '+54 9 341 987-6543' },
  { id: 'apt_3', name: 'Carlos Pérez', time: '22:30', date: '2026-05-31', guests: 2, status: 'completada', phone: '+54 9 261 444-5555' }
];

export const loadData = () => {
  const integrations = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS) 
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS)) 
    : defaultIntegrations;
    
  const conversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) 
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) 
    : defaultConversations;
    
  const appointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) 
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) 
    : defaultAppointments;

  return { integrations, conversations, appointments };
};

export const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export { STORAGE_KEYS };
