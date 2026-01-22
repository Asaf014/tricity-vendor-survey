import { createClient } from '@supabase/supabase-js'

// 🛑 ACTION REQUIRED: PASTE YOUR KEYS INSIDE THE QUOTES BELOW
const supabaseUrl = 'https://sinwgwmfkxhtgtbprsyr.supabase.co'
const supabaseKey = 'sb_publishable_wQMXyKLtl9lrtGEWLg5npw_4HnTNtAp'

export const supabase = createClient(supabaseUrl, supabaseKey)