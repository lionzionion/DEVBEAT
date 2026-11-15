/** Identidade e biblioteca por usuário. Nenhum segredo é usado pelo navegador. */
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.mjs';

export const cloudConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL)
  && /^(sb_publishable_|eyJ)/.test(SUPABASE_PUBLISHABLE_KEY);
let client = null;

export async function getCloudClient() {
  if (!cloudConfigured) return null;
  if (!client) {
    // Importação apenas quando há configuração válida: player anônimo funciona offline do Supabase.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.95.0');
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return client;
}
export async function listenToAuth(callback) {
  const api = await getCloudClient();
  if (!api) return () => {};
  const { data: { subscription } } = api.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
      queueMicrotask(() => callback(session?.user || null, event));
    } else if (event === 'PASSWORD_RECOVERY') {
      queueMicrotask(() => callback(session?.user || null, event));
    }
  });
  return () => subscription.unsubscribe();
}
export async function authAction(action, email, password, displayName = '') {
  const api = await getCloudClient();
  if (!api) throw new Error('A sincronização ainda precisa de um projeto Supabase próprio.');
  const options = { emailRedirectTo: window.location.origin + window.location.pathname };
  let response;
  if (action === 'register') response = await api.auth.signUp({ email, password, options: { ...options, data: { display_name: displayName.slice(0, 40) } } });
  else if (action === 'login') response = await api.auth.signInWithPassword({ email, password });
  else if (action === 'reset') response = await api.auth.resetPasswordForEmail(email, { redirectTo: options.emailRedirectTo });
  else throw new Error('Operação de autenticação inválida');
  if (response.error) throw response.error;
  return response.data;
}
export async function updatePassword(password) {
  const api = await getCloudClient();
  if (!api) throw new Error('Serviço não configurado');
  const { error } = await api.auth.updateUser({ password });
  if (error) throw error;
}
export async function signOut() {
  const api = await getCloudClient();
  if (!api) return;
  const { error } = await api.auth.signOut();
  if (error) throw error;
}
const blankLibrary = () => ({ favorites: {}, playlists: [{ id:'main', name:'Minha playlist', tracks:[] }], history:[], playback:{} });
export function cleanLibrary(snapshot) {
  const raw = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const safeTracks = (v) => Array.isArray(v) ? v.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string').slice(0, 300) : [];
  const favorites = {};
  for (const [key, track] of Object.entries(raw.favorites || {}).slice(0, 500)) {
    if (track && String(track.id) === key && typeof track.title === 'string') favorites[key] = track;
  }
  const playlists = Array.isArray(raw.playlists)
    ? raw.playlists.slice(0, 30).map((p, i) => ({ id: String(p.id || `list-${i}`).slice(0, 80), name: String(p.name || 'Playlist').slice(0, 50), tracks: safeTracks(p.tracks) }))
    : [];
  return {
    favorites,
    playlists: playlists.length ? playlists : blankLibrary().playlists,
    history: safeTracks(raw.history).slice(0, 80),
    playback: raw.playback && typeof raw.playback === 'object' ? raw.playback : {}
  };
}
export async function readCloudLibrary(userId) {
  const api = await getCloudClient();
  const { data, error } = await api.from('devbeat_libraries').select('favorites,playlists,history,playback').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? cleanLibrary(data) : null;
}
export async function writeCloudLibrary(userId, snapshot) {
  const api = await getCloudClient();
  const library = cleanLibrary(snapshot);
  const { error } = await api.from('devbeat_libraries').upsert({ user_id: userId, ...library, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}
export async function saveCloudProfile(userId, displayName) {
  const api = await getCloudClient();
  const { error } = await api.from('devbeat_profiles').upsert({ id: userId, display_name: displayName.slice(0, 40) }, { onConflict: 'id' });
  if (error) throw error;
}
