import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTrack,trackStreamUrl,fetchCatalog,API_ROOTS} from '../catalog.mjs';

test('normalização e segurança de imagens',()=>{
  const t=normalizeTrack({id:'abc',title:'Deep Focus',user:{name:'Producer'},is_streamable:true,artwork:{'480x480':'javascript:alert(1)'}});
  assert.equal(t.title,'Deep Focus');assert.equal(t.artwork,'');assert.equal(t.artist,'Producer');
  assert.equal(normalizeTrack({id:'abc',title:'X',is_streamable:false}),null);
});
test('link válido para streaming oficial',()=>{
  assert.match(trackStreamUrl('aBC-123'),/^https:\/\/api\.audius\.co\/v1\/tracks\/aBC-123\/stream\?app_name=DEVBEAT_Web$/);
  assert.throws(()=>trackStreamUrl('../etc'),/inválido/);
});
test('API direta: consulta tendências e normaliza resposta',async()=>{
  let requested=''; const result=await fetchCatalog({type:'trending',limit:5},async url=>{requested=url;return {ok:true,json:async()=>({data:[{id:'1',title:'Artist Track',user:{name:'Artist'}}]})};});
  assert.match(requested,/tracks\/trending\?/);assert.match(requested,/app_name=DEVBEAT_Web/);assert.equal(result[0].artist,'Artist');
});
test('falha no primeiro host usa host alternativo',async()=>{
  const urls=[];const tracks=await fetchCatalog({type:'search',query:'lofi'},async url=>{urls.push(url); if(url.startsWith(API_ROOTS[0]))throw Error('offline');return {ok:true,json:async()=>({data:[]})};});
  assert.equal(urls.length,2);assert.deepEqual(tracks,[]);assert.match(urls[1],/query=lofi/);
});
test('busca muito curta é recusada',async()=>{await assert.rejects(fetchCatalog({type:'search',query:'x'}),/2 caracteres/);});
