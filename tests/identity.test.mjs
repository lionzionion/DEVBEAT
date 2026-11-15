import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLibrary, cloudConfigured, normalizeDisplayName } from '../identity.mjs';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config.mjs';
test('frontend configurado com chave pública para login', () => {
  assert.equal(cloudConfigured, true);
  assert.match(SUPABASE_URL, /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
  assert.match(SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.doesNotMatch(SUPABASE_PUBLISHABLE_KEY, /service_role|sb_secret_/);
});
test('biblioteca isolada tem playlist inicial', () => {
  const lib = cleanLibrary(null);
  assert.equal(lib.playlists.length, 1);
  assert.deepEqual(lib.favorites, {});
});
test('valida faixas e limita tamanho de histórico', () => {
  const tracks = Array.from({ length:120 },(_,i)=>({id:String(i),title:'Faixa '+i}));
  const library = cleanLibrary({history:tracks,playlists:[{id:'a',name:'Teste',tracks:[{title:'sem id'}, tracks[0]]}]});
  assert.equal(library.history.length,80);
  assert.equal(library.playlists[0].tracks.length,1);
});
test('não aceita favoritos de outra chave ou campos inválidos', () => {
  const lib = cleanLibrary({favorites:{'1':{id:'2',title:'Errada'},'3':{id:'3',title:'Correta'}}});
  assert.deepEqual(Object.keys(lib.favorites),['3']);
});

test('nome por conta é normalizado e limitado', () => {
  assert.equal(normalizeDisplayName('  Ana Dev  '),'Ana Dev');
  assert.equal(normalizeDisplayName('   '),'DEV');
  assert.equal(normalizeDisplayName('x'.repeat(60)).length,40);
});
