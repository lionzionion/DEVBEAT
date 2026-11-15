import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');

test('fila e foco têm IDs únicos e botões utilizáveis',()=>{
  for(const id of ['queueDialog','queueButton','queueBadge','queueCurrent','queueCount','queueList','queueClearButton','queueCloseButton','npQueueButton','focusModeButton','focusTools','focusClock','focusTimerToggle','focusTimerReset']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
});
test('fila tem ação da lista e renderização após mudança de música',()=>{
  assert.match(app,/case 'next':queueNext\(track\)/);
  assert.match(app,/\$\('queueList'\)\.addEventListener\('click',queueAction\)/);
  assert.match(app,/renderTracks\(\);renderQueue\(\)/);
  assert.match(app,/play\(state\.queue\[next\],state\.queue,next\)/);
});
test('modo foco oferece controles e tempo baseado no relógio',()=>{
  assert.match(app,/function toggleFocusMode\(/);
  assert.match(app,/function startFocusClock\(/);
  assert.match(app,/FOCUS_DURATION=25\*60/);
  assert.match(app,/Date\.now\(\)\+focusRemaining\*1000/);
  assert.match(css,/\.nowplaying-dialog\.focus-layout/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
test('publicação inclui o módulo da fila e versão de cache atualizada',()=>{
  assert.match(workflow,/cp index\.html styles\.css app\.js catalog\.mjs queue\.mjs/);
  assert.match(html,/styles\.css\?v=23/);
  assert.match(html,/app\.js\?v=23/);
});
