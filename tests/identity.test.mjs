import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLibrary, cloudConfigured } from '../identity.mjs';
test('sem configuração não habilita login ou bibliotecas compartilhadas', () => assert.equal(cloudConfigured, false));
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
