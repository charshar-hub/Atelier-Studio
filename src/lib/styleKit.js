import { supabase, isSupabaseConfigured } from './supabase';

// No auth layer yet, so every session shares one logical user. Swap this
// for the authed user's id when auth lands.
const USER_ID = 'default';

function assertClient(op) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error(
      'Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
    console.error(`[supabase] ${op} blocked:`, err.message);
    throw err;
  }
}

// SELECT — matches spec: plain .select('*') filtered by user_id.
export async function fetchStyleKit() {
  console.log('[supabase] fetching style kit for user:', USER_ID);
  assertClient('fetchStyleKit');

  const { data, error } = await supabase
    .from('style_kit')
    .select('*')
    .eq('user_id', USER_ID);

  console.log('[supabase] fetchStyleKit data:', data);
  console.log('[supabase] fetchStyleKit error:', error);
  if (error) {
    console.log(error);
    throw error;
  }

  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!row) return { profile: null, sampleText: '' };
  return {
    profile: row.profile ?? null,
    sampleText: row.sample_text ?? '',
  };
}

// SAVE — explicit "does the row exist? update : insert" flow instead of
// upsert. Avoids the 400 we were getting from on_conflict=id when the
// table's unique constraint didn't match.
export async function saveStyleKit({ profile, sampleText }) {
  assertClient('saveStyleKit');

  const payload = {
    user_id: USER_ID,
    profile: profile ?? null,
    sample_text: sampleText ?? '',
  };
  console.log('[supabase] saveStyleKit payload:', payload);

  // 1. Check if a row already exists for this user_id.
  const { data: existing, error: checkErr } = await supabase
    .from('style_kit')
    .select('user_id')
    .eq('user_id', USER_ID);
  console.log('[supabase] existing row check:', { existing, checkErr });
  if (checkErr) {
    console.log(checkErr);
    throw checkErr;
  }

  const rowExists = Array.isArray(existing) && existing.length > 0;

  // 2. Update if present, otherwise insert.
  if (rowExists) {
    const { data, error } = await supabase
      .from('style_kit')
      .update(payload)
      .eq('user_id', USER_ID)
      .select();
    console.log('[supabase] update result:', { data, error });
    if (error) {
      console.log(error);
      throw error;
    }
    return;
  }

  const { data, error } = await supabase
    .from('style_kit')
    .insert([payload])
    .select();
  console.log('[supabase] insert result:', { data, error });
  if (error) {
    console.log(error);
    throw error;
  }
}
