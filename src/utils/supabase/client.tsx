import { createClient as createSupabaseClient } from 'npm:@supabase/supabase-js@2.39.3'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseInstance
}