import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'COLE_SUA_ANON_KEY_AQUI') {
  console.warn(
    '⚠️ Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env\n' +
    'O dashboard funcionará com dados mock até a configuração ser concluída.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: {
      params: { eventsPerSecond: 10 }
    }
  }
)

export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'COLE_SUA_ANON_KEY_AQUI'
}
