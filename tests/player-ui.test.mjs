import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('tela tocando agora contém controles com identificadores únicos',()=>{
  const ids=['nowPlayingDialog','npTitle','npArtist','npStatus','npProgress','npArtwork','npPlay','npPrevious','npNext','npShuffle','npRepeat','npLike','npCloseButton','playerArt','expandPlayerButton'];
  for(const id of ids){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'ID ausente ou duplicado: '+id);
  }
});
test('player expandido reutiliza reprodução original e atualiza a timeline',()=>{
  assert.match(js,/function updateNowPlaying\(/);
  assert.match(js,/function syncExpandedProgress\(/);
  assert.match(js,/\$\('npPlay'\)\.addEventListener\('click',togglePlay\)/);
  assert.match(js,/\$\('npNext'\)\.addEventListener\('click',\(\)=>skip\(1\)\)/);
  assert.match(js,/\$\('npProgress'\)\.addEventListener\('input'/);
  assert.match(js,/updateNowPlaying\(track\);syncExpandedProgress\(\)/);
});
test('arte não é refeita em todo update e animações respeitam acessibilidade',()=>{
  assert.match(js,/artKey !== lastPlayerArtKey/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.music-playing \.np-record/);
  assert.match(css,/animation-play-state:paused/);
});
