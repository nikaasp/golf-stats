import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const missingConfig = []

if (!supabaseUrl) {
  missingConfig.push("VITE_SUPABASE_URL")
}

if (!supabaseKey) {
  missingConfig.push("VITE_SUPABASE_ANON_KEY")
}

export const supabaseConfigError =
  missingConfig.length > 0
    ? `Missing Supabase environment variables: ${missingConfig.join(
        ", "
      )}. Add them in Vercel Project Settings -> Environment Variables and redeploy.`
    : null

export const supabase =
  supabaseConfigError === null ? createClient(supabaseUrl, supabaseKey) : null
