/* DEVBEAT Web — streaming via catálogo público Audius */
'use strict';
import { fetchCatalog, trackStreamUrl } from './catalog.mjs';
const $ = (id) => document.getElementById(id);
const modes = [
  { id:'deep', title:'Deep Focus', subtitle:'Concentração máxima', genre:'Ambient', query:'ambient', color:'#a1ff5f', symbol:'◎', detail:'Um ambiente sonoro para mergulhar no código.' },
  { id:'sprint', title:'Code Sprint', subtitle:'Energia para entregar', genre:'Electronic', query:'electronic', color:'#a08cff', symbol:'ϟ', detail:'Beats para manter o ritmo e tirar tarefas do backlog.' },
  { id:'debug', title:'Bug Hunter', subtitle:'Investigue no ritmo', genre:'Hip-Hop/Rap', query:'instrumental hip hop', color:'#f8be76', symbol:'⌁', detail:'Batidas para perseguir o bug até o fim.' },
  { id:'night', title:'Night Build', subtitle:'Produza madrugada', genre:'Lo-Fi', query:'lofi', color:'#73dec9', symbol:'☾', detail:'Aquela trilha para quando a cidade dorme.' },
  { id:'chill', title:'Chill Commit', subtitle:'Desacelere criando', genre:'Jazz', query:'jazz chill', color:'#fb81d5', symbol:'✳', detail:'Um respiro entre commits e boas ideias.' }
];
const storage = {
  get(key, fallback){ try { const value=JSON.parse(localStorage.getItem('devbeat:'+key)); return value===null?fallback:value; }catch{return fallback;} },
  set(key,value){ try{localStorage.setItem('devbeat:'+key,JSON.stringify(value));}catch{} }
};
const state = {
  view:'discover', mode:null, tracks:[], queue:[], index:-1, current:null,
  likes:storage.get('likes',{}), playlist:storage.get('playlist',[]),
  shuffle:false, repeat:false, isPlaying:false, isLoading:false,
  name:storage.get('name','DEV'), requestId:0, toastTimer:null
};
const audio = $('audio'); audio.volume=.8;
const time = (s) => { if(!Number.isFinite(Number(s))||Number(s)<0)return '0:00'; const n=Math.floor(Number(s));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
const safe = (value) => String(value??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = (value) => {try{const u=new URL(String(value));return u.protocol==='https:'?u.href:'';}catch{return '';}};
const ids = (array) => [...new Set((array||[]).map(x=>String(x.id)))];
const prettyCount = (n) => !n?'—':n>=1000000?(n/1000000).toFixed(1)+' mi':n>=1000?(n/1000).toFixed(1)+' mil':String(n);
const hasLike = (id) => Boolean(state.likes[String(id)]);
const inPlaylist = (id) => state.playlist.some(x=>String(x.id)===String(id));
function flash(message) {const box=$('toast'); box.textContent=message; box.classList.add('visible'); clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>box.classList.remove('visible'),3300);}
function updateName(){const label=(state.name||'DEV').trim();$('profileButton').textContent=label.slice(0,3).toUpperCase();$('profileButton').title='Perfil: '+label;}
function renderModes(){
 $('modeGrid').innerHTML=modes.map(m=>'<button class="mode-card '+(state.mode===m.id?'selected':'')+'" style="--mode-color:'+m.color+'" data-mode="'+m.id+'" aria-label="Ativar '+safe(m.title)+'"><span class="mode-symbol">'+m.symbol+'</span><strong>'+safe(m.title)+'</strong><small>'+safe(m.subtitle)+'</small><span class="arrow">↗</span></button>').join('');
 $('sidebarModes').innerHTML=modes.map(m=>'<button class="side-mode '+(state.mode===m.id?'selected':'')+'" data-mode="'+m.id+'"><span class="side-dot" style="background:'+m.color+'"></span>'+safe(m.title)+'</button>').join('');
}
function renderNav(){document.querySelectorAll('.nav-item').forEach(el=>{const on=el.dataset.view===state.view;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});}
function setHeading(overline,title,subtitle){$('tracksOverline').textContent=overline;$('tracksTitle').innerHTML=title;$('tracksSubtitle').textContent=subtitle;}
function renderEmpty(message,detail,button){$('resultsCount').textContent='';$('tracksList').innerHTML='<div class="empty-tracks"><strong>'+safe(message)+'</strong><p>'+safe(detail)+'</p>'+(button?'<button id="emptyAction">'+safe(button)+'</button>':'')+'</div>';if(button)$('emptyAction').addEventListener('click',()=>setView('discover'));}
function trackArt(track){const url=safeUrl(track.artwork);return '<div class="track-art">'+(url?'<img src="'+safe(url)+'" alt="" loading="lazy" onerror="this.remove()"/>':'♫')+'</div>';}
function rowHtml(track,i){const playing=state.current&&String(state.current.id)===String(track.id);return '<div class="track-row '+(playing?'playing':'')+'" data-id="'+safe(track.id)+'"><span class="track-index">'+(playing?'♫':String(i+1).padStart(2,'0'))+'</span>'+trackArt(track)+'<div class="track-meta"><button class="track-title" data-action="play" title="Reproduzir '+safe(track.title)+'">'+safe(track.title)+'</button><span class="track-artist">'+safe(track.artist)+'</span></div><span class="track-genre">'+safe(track.genre||'Música')+'</span><span class="track-playcount">'+prettyCount(track.plays)+' plays</span><span class="track-time">'+time(track.duration)+'</span><button class="track-love '+(hasLike(track.id)?'liked':'')+'" data-action="like" aria-label="Favoritar '+safe(track.title)+'">'+(hasLike(track.id)?'♥':'♡')+'</button><button class="track-add '+(inPlaylist(track.id)?'added':'')+'" data-action="add" aria-label="Adicionar '+safe(track.title)+' à playlist">'+(inPlaylist(track.id)?'✓':'＋')+'</button></div>';}
function getVisibleTracks(){if(state.view==='liked')return Object.values(state.likes);if(state.view==='playlist')return state.playlist;return state.tracks;}
function renderTracks(){const data=getVisibleTracks();$('resultsCount').textContent=data.length?data.length+' FAIXAS':'';if(!data.length){ if(state.view==='liked')renderEmpty('Sua biblioteca começa com um coração','Toque em ♡ em qualquer faixa para salvar suas favoritas.','Descobrir músicas');else if(state.view==='playlist')renderEmpty('A sua playlist está vazia','Use o botão + de qualquer música para criar sua seleção.','Explorar catálogo');else renderEmpty('Nenhuma faixa encontrada','Tente outra pesquisa ou escolha um modo CodeFlow.','Explorar músicas');return;} $('tracksList').innerHTML=data.map(rowHtml).join('');}
function setView(view){
 state.view=view;state.mode=null;renderNav();renderModes();$('searchInput').value='';$('sidebar').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');
 if(view==='discover'){ $('hero').hidden=false;$('flowSection').hidden=false;setHeading('FAIXAS EM DESTAQUE','No radar <span>agora</span>','Seleção real do catálogo Audius, atualizada online.');loadTracks('trending');}
 if(view==='codeflow'){$('hero').hidden=true;$('flowSection').hidden=false;setHeading('SINTONIZE SUA SESSÃO','Escolha seu <span>CodeFlow</span>','Selecione um dos modos acima para iniciar.');loadTracks('trending');}
 if(view==='liked'){$('hero').hidden=true;$('flowSection').hidden=true;setHeading('SUA BIBLIOTECA','Músicas <span>favoritas</span>','As faixas que você guardou neste navegador.');renderTracks();}
 if(view==='playlist'){$('hero').hidden=true;$('flowSection').hidden=true;setHeading('SUA SELEÇÃO','Minha <span>playlist</span>','Sua lista pessoal, salva localmente neste dispositivo.');renderTracks();}
 window.scrollTo({top:0,behavior:'smooth'});
}
async function getCatalog(params){ return fetchCatalog(params); }
async function loadTracks(kind,query=''){
 const req=++state.requestId;state.isLoading=true;$('resultsCount').textContent='';$('tracksList').innerHTML='<div class="loading-tracks"><span class="spinner"></span> Buscando músicas reais para você...</div>';
 try{const payload={limit:'24',type:kind};if(query)payload.query=query;const results=await getCatalog(payload);if(req!==state.requestId)return;state.tracks=results;renderTracks();if(!results.length&&kind==='search')flash('Não encontramos faixas. Tente outro termo.');}
 catch(err){if(req!==state.requestId)return;state.tracks=[];renderEmpty('O catálogo está indisponível',String(err.message||'Erro na conexão')+'. Verifique sua internet e tente atualizar.');flash('Falha ao consultar o Audius');}
 finally{if(req===state.requestId)state.isLoading=false;}
}
function selectMode(modeId){
 const mode=modes.find(m=>m.id===modeId);if(!mode)return;state.view='codeflow';state.mode=modeId;renderNav();renderModes();$('hero').hidden=true;$('flowSection').hidden=false;$('sidebar').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');$('searchInput').value='';
 $('miniSessionTitle').textContent=mode.title;setHeading('CODEFLOW • '+mode.title.toUpperCase(),safe(mode.title)+' <span>mix</span>',mode.detail);loadTracks('search',mode.query);$('tracksList').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function toggleLike(track){if(!track)return;if(hasLike(track.id)){delete state.likes[String(track.id)];flash('Removida das favoritas');}else{state.likes[String(track.id)]=track;flash('Salva nas favoritas ♡');}storage.set('likes',state.likes);renderTracks();updatePlayer();}
function togglePlaylist(track){if(!track)return;if(inPlaylist(track.id)){state.playlist=state.playlist.filter(t=>String(t.id)!==String(track.id));flash('Removida da playlist');}else{state.playlist.push(track);flash('Adicionada à sua playlist +');}storage.set('playlist',state.playlist);renderTracks();}
function updatePlayer(){
 const track=state.current;$('playerTitle').textContent=track?track.title:'Escolha uma música';$('playerArtist').textContent=track?track.artist:'Seu flow começa aqui';$('playerArt').innerHTML=track&&safeUrl(track.artwork)?'<img src="'+safe(safeUrl(track.artwork))+'" alt=""/>':'<span>♫</span>';
 $('playerLike').classList.toggle('liked',track?hasLike(track.id):false);$('playerLike').textContent=track&&hasLike(track.id)?'♥':'♡';$('playButton').textContent=state.isPlaying?'❚❚':'▶';$('playButton').setAttribute('aria-label',state.isPlaying?'Pausar':'Reproduzir');$('shuffleButton').classList.toggle('active',state.shuffle);$('repeatButton').classList.toggle('active',state.repeat);$('duration').textContent=time(Number.isFinite(audio.duration)?audio.duration:track?.duration||0);document.title=(track?track.title+' — ':'')+'DEVBEAT — Code Your Rhythm';
 if('mediaSession' in navigator && track){try{navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.artist,album:'DEVBEAT · Audius',artwork:track.artwork?[{src:safeUrl(track.artwork),sizes:'480x480',type:'image/jpeg'}]:[]});}catch{}}
}
async function play(track,queue){
 if(!track)return;state.queue=queue&&queue.length?queue:[track];state.index=state.queue.findIndex(t=>String(t.id)===String(track.id));if(state.index<0){state.queue.push(track);state.index=state.queue.length-1;}
 state.current=track;state.isPlaying=false;audio.pause();audio.src=trackStreamUrl(track.id);audio.load();updatePlayer();renderTracks();
 try{await audio.play();state.isPlaying=true;updatePlayer();}catch(e){state.isPlaying=false;updatePlayer();if(e.name!=='AbortError')flash('Não foi possível reproduzir esta faixa. Tente outra.');}
}
function togglePlay(){if(!state.current){const first=getVisibleTracks()[0];if(first)play(first,getVisibleTracks());else flash('Escolha uma faixa primeiro');return;}if(audio.paused){audio.play().then(()=>{state.isPlaying=true;updatePlayer();}).catch(()=>flash('Reprodução indisponível para esta faixa'));}else{audio.pause();state.isPlaying=false;updatePlayer();}}
function skip(direction){if(!state.queue.length)return;let next;if(state.shuffle&&state.queue.length>1){next=state.index;while(next===state.index)next=Math.floor(Math.random()*state.queue.length);}else next=(state.index+direction+state.queue.length)%state.queue.length;play(state.queue[next],state.queue);}
function refresh(){if(state.view==='liked'||state.view==='playlist'){renderTracks();return;}if($('searchInput').value.trim())loadTracks('search',$('searchInput').value.trim());else if(state.mode){const m=modes.find(x=>x.id===state.mode);loadTracks('search',m.query);}else loadTracks('trending');}
function handleSearch(term){state.view='discover';state.mode=null;renderNav();renderModes();$('hero').hidden=true;$('flowSection').hidden=true;setHeading('RESULTADOS DA BUSCA','Sua <span>pesquisa</span>','Músicas e artistas encontrados no Audius.');loadTracks('search',term);}
function wireEvents(){
 document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
 $('modeGrid').addEventListener('click',e=>{const el=e.target.closest('[data-mode]');if(el)selectMode(el.dataset.mode);});
 $('sidebarModes').addEventListener('click',e=>{const el=e.target.closest('[data-mode]');if(el)selectMode(el.dataset.mode);});
 $('tracksList').addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const row=button.closest('[data-id]');if(!row)return;const track=getVisibleTracks().find(t=>String(t.id)===row.dataset.id);if(!track)return;switch(button.dataset.action){case 'play': if(state.current&&String(state.current.id)===String(track.id))togglePlay();else play(track,getVisibleTracks());break;case 'like':toggleLike(track);break;case 'add':togglePlaylist(track);break;}});
 $('refreshButton').addEventListener('click',refresh);
 $('startFlowButton').addEventListener('click',()=>{const first=state.tracks[0];if(first)play(first,state.tracks);else selectMode('deep');});
 $('exploreModesButton').addEventListener('click',()=>setView('codeflow'));
 $('allModesButton').addEventListener('click',()=>setView('codeflow'));
 $('focusButton').addEventListener('click',()=>selectMode('deep'));
 $('playButton').addEventListener('click',togglePlay);
 $('previousButton').addEventListener('click',()=>skip(-1));$('nextButton').addEventListener('click',()=>skip(1));
 $('shuffleButton').addEventListener('click',()=>{state.shuffle=!state.shuffle;updatePlayer();flash(state.shuffle?'Modo aleatório ativado':'Modo aleatório desativado');});
 $('repeatButton').addEventListener('click',()=>{state.repeat=!state.repeat;updatePlayer();flash(state.repeat?'Repetição ativada':'Repetição desativada');});
 $('playerLike').addEventListener('click',()=>toggleLike(state.current));$('playlistCurrentButton').addEventListener('click',()=>togglePlaylist(state.current));
 $('volume').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;});
 $('progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)*audio.duration/100;});
 let searchTimer;$('searchInput').addEventListener('input',e=>{clearTimeout(searchTimer);const term=e.target.value.trim();searchTimer=setTimeout(()=>{if(term.length>=2)handleSearch(term);else if(!term)setView('discover');},400);});
 $('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(searchTimer);const q=e.target.value.trim();if(q)handleSearch(q);}});
 $('menuButton').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menuButton').setAttribute('aria-expanded',String(open));});
 $('profileButton').addEventListener('click',()=>{$('displayName').value=state.name==='DEV'?'':state.name;$('profileDialog').showModal();});
 $('saveProfileButton').addEventListener('click',()=>{const newName=$('displayName').value.trim().slice(0,30);state.name=newName||'DEV';storage.set('name',state.name);updateName();flash('Perfil atualizado');});
 audio.addEventListener('play',()=>{state.isPlaying=true;updatePlayer();});audio.addEventListener('pause',()=>{state.isPlaying=false;updatePlayer();});
 audio.addEventListener('timeupdate',()=>{const p=audio.duration?100*audio.currentTime/audio.duration:0;$('progress').value=String(p);$('progress').style.setProperty('--progress',p+'%');$('currentTime').textContent=time(audio.currentTime);});
 audio.addEventListener('loadedmetadata',updatePlayer);audio.addEventListener('ended',()=>{if(state.repeat){audio.currentTime=0;audio.play().catch(()=>{});}else skip(1);});
 audio.addEventListener('error',()=>{if(state.current){state.isPlaying=false;updatePlayer();flash('Esta faixa está indisponível no Audius. Escolha outra.');}});
 document.addEventListener('keydown',e=>{const tag=document.activeElement?.tagName;if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(tag)){e.preventDefault();$('searchInput').focus();return;}if(['INPUT','TEXTAREA'].includes(tag)||$('profileDialog').open)return;if(e.code==='Space'&&!e.repeat){e.preventDefault();togglePlay();}if(e.altKey&&e.key==='ArrowRight')skip(1);if(e.altKey&&e.key==='ArrowLeft')skip(-1);});
 if('mediaSession' in navigator){try{navigator.mediaSession.setActionHandler('play',togglePlay);navigator.mediaSession.setActionHandler('pause',togglePlay);navigator.mediaSession.setActionHandler('previoustrack',()=>skip(-1));navigator.mediaSession.setActionHandler('nexttrack',()=>skip(1));}catch{}}
}
renderModes();updateName();wireEvents();loadTracks('trending');
