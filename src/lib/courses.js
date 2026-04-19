import { supabase, isSupabaseConfigured } from './supabase';

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    );
  }
}

export async function listCourses() {
  ensureConfigured();
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCourse(id) {
  ensureConfigured();
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCourse({ title, content }) {
  ensureConfigured();
  const { data, error } = await supabase
    .from('courses')
    .insert({ title, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id, { title, content }) {
  ensureConfigured();
  const { data, error } = await supabase
    .from('courses')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCourse(id) {
  ensureConfigured();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

export async function renameCourse(id, title) {
  ensureConfigured();
  const { data, error } = await supabase
    .from('courses')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function duplicateCourse(id) {
  ensureConfigured();
  const source = await getCourse(id);
  const copyTitle = `${source.title || 'Untitled course'} (Copy)`;
  return createCourse({ title: copyTitle, content: source.content || {} });
}
