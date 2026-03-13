import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qxemsdlvpkfxewfuiblx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZW1zZGx2cGtmeGV3ZnVpYmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDAwMjksImV4cCI6MjA4ODk3NjAyOX0.n9CbekBXAeqzDB-6PNNEx72aX2bANzOGIY9VnEWEUrY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)