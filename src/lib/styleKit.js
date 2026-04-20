import { supabase, isSupabaseConfigured } from './supabase';

// Singleton row id. The app has no auth layer, so the entire deployment
// shares one style_kit row. Swap for a user-scoped key if/when auth lands.
const ROW_ID = 'default';

function assertClient(op) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error(
      'Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
    console.error(`[supabase] ${op} blocked:`, err.message);
    throw err;
  }
}

export async function fetchStyleKit() {
  console.log('[supabase] fetching style kit...');
  assertClient('fetchStyleKit');
  const { data, error } = await supabase
    .from('style_kit')
    .select('profile, sample_text')
    .eq('id', ROW_ID)
    .maybeSingle();
  console.log('[supabase] result:', data);
  console.log('[supabase] error:', error);
  if (error) throw error;
  if (!data) return { profile: null, sampleText: '' };
  return {
    profile: data.profile ?? null,
    sampleText: data.sample_text ?? '',
  };
}

export async function saveStyleKit({ profile, sampleText }) {
  console.log('[supabase] saving style kit...');
  assertClient('saveStyleKit');
  const { error } = await supabase.from('style_kit').upsert(
    {
      id: ROW_ID,
      profile: profile ?? null,
      sample_text: sampleText ?? '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  console.log('[supabase] save error:', error);
  if (error) throw error;
}
