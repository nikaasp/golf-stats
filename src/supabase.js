import { createClient } from '@supabase/supabase-js'

// Replace these with your Supabase project values:
const supabaseUrl = "https://xnnepnzgpuqevzvrsilx.supabase.co"
const supabaseKey = "sb_publishable_zz7S4F0Bbe85XBxpjmKAeg_9YN1z5ZB"

export const supabase = createClient(supabaseUrl, supabaseKey)