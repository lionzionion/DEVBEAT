import test from 'node:test';
import assert from 'node:assert/strict';
import { upcoming, playNext, moveUpcoming, removeUpcoming, clearUpcoming } from '../queue.mjs';
const tracks = ['A','B','C','D'].map(id=>({id,title:id}));

test('enfileirar música logo após a atual, sem modificar a playlist original',()=>{
  const before=tracks.slice();
  const result=playNext(before,1,{id:'X',title:'Nova'});
  assert.deepEqual(result.queue.map(x=>x.id),['A','B','X','C','D']);
  assert.equal(result.index,1);
  assert.deepEqual(before,tracks);
});
test('reagendar uma faixa futura sem repeti-la',()=>{
  const result=playNext(tracks,0,tracks[3]);
  assert.deepEqual(result.queue.map(x=>x.id),['A','D','B','C']);
});
test('não coloca música atual duas vezes',()=>{
  const result=playNext(tracks,2,tracks[2]);
  assert.equal(result.changed,false);
  assert.deepEqual(result.queue,tracks);
});
test('subir e descer afetam somente as próximas, sem trocar a música atual',()=>{
  const up=moveUpcoming(tracks,1,3,-1);
  assert.deepEqual(up.queue.map(x=>x.id),['A','B','D','C']);
  const invalid=moveUpcoming(tracks,1,2,-1);
  assert.equal(invalid.changed,false);
  assert.deepEqual(invalid.queue,tracks);
  const down=moveUpcoming(tracks,0,1,1);
  assert.deepEqual(down.queue.map(x=>x.id),['A','C','B','D']);
});
test('remover nunca exclui faixa atual ou anterior',()=>{
  assert.equal(removeUpcoming(tracks,1,1).changed,false);
  assert.equal(removeUpcoming(tracks,1,0).changed,false);
  assert.deepEqual(removeUpcoming(tracks,1,3).queue.map(x=>x.id),['A','B','C']);
});
test('limpar fila preserva atual e histórico anterior',()=>{
  assert.deepEqual(clearUpcoming(tracks,1).queue.map(x=>x.id),['A','B']);
  assert.deepEqual(clearUpcoming(tracks,3).queue,tracks);
  assert.deepEqual(clearUpcoming(tracks,-1).queue,[]);
});
test('fila vazia e dados inválidos não quebram o aplicativo',()=>{
  assert.deepEqual(upcoming([],0),[]);
  assert.deepEqual(playNext([], -1, tracks[0]).queue.map(t=>t.id), ['A']);
  assert.equal(playNext(tracks,1,{id:'Z'}).changed,false);
  assert.equal(removeUpcoming(tracks,1,99).changed,false);
});
