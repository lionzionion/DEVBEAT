/* DEVBEAT Web — streaming via catálogo público Audius */
'use strict';
import { fetchCatalog, trackStreamUrl } from './catalog.mjs';
import { cloudConfigured, listenToAuth, authAction, updatePassword, signOut, cleanLibrary, readCloudLibrary, writeCloudLibrary, readCloudProfile, saveCloudProfile, normalizeDisplayName } from './identity.mjs';
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
  playlists:storage.get('playlists',null), selectedPlaylistId:storage.get('selectedPlaylistId','main'),
  history:storage.get('history',[]), playback:storage.get('playback',{}),
  user:null, cloudReady:false, cloudBusy:false, syncTimer:null, authEpoch:0, authMode:'login',
  catalog:{type:'trending',query:'',offset:0,more:false},
  shuffle:false, repeat:false, isPlaying:false, isLoading:false,
  name:storage.get('name','DEV'), requestId:0, toastTimer:null
};
if(!Array.isArray(state.playlists)||!state.playlists.length) state.playlists=[{id:'main',name:'Minha playlist',tracks:state.playlist}];
if(!state.playlists.find(p=>p.id===state.selectedPlaylistId)) state.selectedPlaylistId=state.playlists[0].id;
state.playlist=state.playlists.find(p=>p.id===state.selectedPlaylistId).tracks;
let guestLibrary = cleanLibrary({favorites:state.likes,playlists:state.playlists,history:state.history,playback:state.playback});
let guestName = state.name;
let pendingCloudSave = null;
const pendingKey = (userId) => 'pending:' + userId;
function canEditLibrary() {
  if (state.user && !state.cloudReady) { flash('Sua biblioteca está carregando. Tente novamente.'); return false; }
  return true;
}
function clearSessionPlayer() {
  state.current = null; state.queue = []; state.index = -1; state.isPlaying = false;
  audio.pause(); audio.removeAttribute('src'); audio.load(); updatePlayer();
}
const audio = $('audio'); audio.volume=.8;
function snapshot(){return cleanLibrary({favorites:state.likes,playlists:state.playlists,history:state.history,playback:state.playback});}
function persistGuest(){if(state.user)return;const s=snapshot();guestLibrary=s;storage.set('likes',s.favorites);storage.set('playlists',s.playlists);storage.set('selectedPlaylistId',state.selectedPlaylistId);storage.set('playlist',state.playlist);storage.set('history',s.history);storage.set('playback',s.playback);}
async function flushCloud() {
  if (!state.user || !state.cloudReady) return true;
  const userId = state.user.id;
  const pending = pendingCloudSave;
  if (!pending || pending.userId !== userId) return true;
  try {
    await writeCloudLibrary(userId, pending.library);
    // Não descarte alterações feitas enquanto a requisição anterior estava em andamento.
    if (pendingCloudSave === pending) {
      pendingCloudSave = null;
      storage.set(pendingKey(userId), null);
    } else if (pendingCloudSave?.userId === userId) {
      clearTimeout(state.syncTimer);
      state.syncTimer = setTimeout(flushCloud, 750);
    }
    return true;
  } catch (e) {
    flash('Biblioteca pendente de sincronização: ' + String(e.message || 'Erro de rede'));
    return false;
  }
}
function persistLibrary() {
  if (!state.user) { persistGuest(); return; }
  if (!state.cloudReady) return;
  pendingCloudSave = { userId: state.user.id, library: snapshot(), savedAt: Date.now() };
  storage.set(pendingKey(state.user.id), pendingCloudSave);
  clearTimeout(state.syncTimer);
  state.syncTimer = setTimeout(flushCloud, 750);
}
function adoptLibrary(s){const lib=cleanLibrary(s);state.likes=lib.favorites;state.playlists=lib.playlists;state.selectedPlaylistId=state.playlists[0].id;state.playlist=state.playlists[0].tracks;state.history=lib.history;state.playback=lib.playback;updateResume();renderPlaylistSelect();renderTracks();updatePlayer();}
function updateResume(){$('resumeButton').hidden=!state.playback?.track?.id;}
function renderPlaylistSelect(){const sel=$('playlistSelect');if(!sel)return;sel.innerHTML=state.playlists.map(p=>'<option value="'+safe(p.id)+'">'+safe(p.name)+'</option>').join('');sel.value=state.selectedPlaylistId;}

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
function getVisibleTracks(){if(state.view==='liked')return Object.values(state.likes);if(state.view==='playlist')return state.playlist;if(state.view==='history')return state.history;return state.tracks;}
function renderTracks(){const data=getVisibleTracks();$('resultsCount').textContent=data.length?data.length+' FAIXAS':'';if(!data.length){ if(state.view==='liked')renderEmpty('Sua biblioteca começa com um coração','Toque em ♡ em qualquer faixa para salvar suas favoritas.','Descobrir músicas');else if(state.view==='history')renderEmpty('Nenhuma música no histórico','As faixas que você escutar aparecerão aqui.','Explorar músicas');else if(state.view==='playlist')renderEmpty('A sua playlist está vazia','Use o botão + de qualquer música para criar sua seleção.','Explorar catálogo');else renderEmpty('Nenhuma faixa encontrada','Tente outra pesquisa ou escolha um modo CodeFlow.','Explorar músicas');return;} $('tracksList').innerHTML=data.map(rowHtml).join('');}
function setView(view){
 state.view=view;state.mode=null;renderNav();renderModes();$('playlistControls').hidden=view!=='playlist';$('genreFilters').hidden=view!=='discover';$('loadMoreButton').hidden=true;$('searchInput').value='';$('sidebar').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');
 if(view==='discover'){ $('hero').hidden=false;$('flowSection').hidden=false;setHeading('FAIXAS EM DESTAQUE','No radar <span>agora</span>','Seleção real do catálogo Audius, atualizada online.');loadTracks('trending');}
 if(view==='codeflow'){$('hero').hidden=true;$('flowSection').hidden=false;setHeading('SINTONIZE SUA SESSÃO','Escolha seu <span>CodeFlow</span>','Selecione um dos modos acima para iniciar.');loadTracks('trending');}
 if(view==='liked'){$('hero').hidden=true;$('flowSection').hidden=true;setHeading('SUA BIBLIOTECA','Músicas <span>favoritas</span>','As faixas que você guardou neste navegador.');renderTracks();}
 if(view==='playlist'){$('hero').hidden=true;$('flowSection').hidden=true;setHeading('SUA SELEÇÃO','Minhas <span>playlists</span>',state.user?'Suas listas sincronizadas com a conta.':'Playlists salvas neste dispositivo.');renderPlaylistSelect();renderTracks();}
 if(view==='history'){$('hero').hidden=true;$('flowSection').hidden=true;setHeading('SUAS ÚLTIMAS SESSÕES','Ouvidas <span>recentemente</span>',state.user?'Histórico da sua conta.':'Histórico deste navegador.');renderTracks();}
 window.scrollTo({top:0,behavior:'smooth'});
}
async function getCatalog(params){ return fetchCatalog(params); }
async function loadTracks(kind,query=''){
 const req=++state.requestId;state.isLoading=true;$('resultsCount').textContent='';$('tracksList').innerHTML='<div class="loading-tracks"><span class="spinner"></span> Buscando músicas reais para você...</div>';
 try{const payload={limit:30,offset:0,type:kind};if(query)payload.query=query;const results=await getCatalog(payload);if(req!==state.requestId)return;state.catalog={type:kind,query,offset:results.length,more:results.length===30};state.tracks=results;renderTracks();$('loadMoreButton').hidden=!state.catalog.more; if(!results.length&&kind==='search')flash('Não encontramos faixas. Tente outro termo.');}
 catch(err){if(req!==state.requestId)return;$('loadMoreButton').hidden=true;state.tracks=[];renderEmpty('O catálogo está indisponível',String(err.message||'Erro na conexão')+'. Verifique sua internet e tente atualizar.');flash('Falha ao consultar o Audius');}
 finally{if(req===state.requestId)state.isLoading=false;}
}
async function loadMore(){if(state.isLoading||!state.catalog.more)return;const c={...state.catalog};const btn=$('loadMoreButton');btn.disabled=true;btn.textContent='Carregando músicas...';try{const newTracks=await getCatalog({type:c.type,query:c.query,offset:c.offset,limit:30});const existing=new Set(state.tracks.map(t=>String(t.id)));state.tracks.push(...newTracks.filter(t=>!existing.has(String(t.id))));state.catalog.offset+=newTracks.length;state.catalog.more=newTracks.length===30;btn.hidden=!state.catalog.more;renderTracks();if(!newTracks.length)flash('Você chegou ao fim desta seleção.');}catch(e){flash(String(e.message||'Erro ao carregar novas músicas'));}finally{btn.disabled=false;btn.textContent='Carregar mais músicas ↓';}}
function selectMode(modeId){
 const mode=modes.find(m=>m.id===modeId);if(!mode)return;state.view='codeflow';state.mode=modeId;renderNav();renderModes();$('hero').hidden=true;$('flowSection').hidden=false;$('sidebar').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');$('searchInput').value='';
 $('miniSessionTitle').textContent=mode.title;setHeading('CODEFLOW • '+mode.title.toUpperCase(),safe(mode.title)+' <span>mix</span>',mode.detail);loadTracks('search',mode.query);$('tracksList').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function toggleLike(track){if(!track||!canEditLibrary())return;if(hasLike(track.id)){delete state.likes[String(track.id)];flash('Removida das favoritas');}else{state.likes[String(track.id)]=track;flash('Salva nas favoritas ♡');}persistLibrary();renderTracks();updatePlayer();}
function togglePlaylist(track){if(!track||!canEditLibrary())return;if(inPlaylist(track.id)){state.playlist=state.playlist.filter(t=>String(t.id)!==String(track.id));flash('Removida da playlist');}else{state.playlist.push(track);flash('Adicionada à sua playlist +');}persistLibrary();renderTracks();}
let lastPlayerArtKey = null;
let lastDialogArtKey = null;
function updateNowPlaying(track) {
  const playing = Boolean(track && state.isPlaying);
  document.body.classList.toggle('music-playing', playing);
  $('player').classList.toggle('is-playing', playing);
  $('npTitle').textContent = track?.title || 'Seu flow começa aqui';
  $('npArtist').textContent = track?.artist || 'Escolha uma faixa na biblioteca';
  $('npStatus').textContent = playing ? '● TOCANDO AGORA' : (track ? 'Ⅱ EM PAUSA' : 'PRONTO PARA OUVIR');
  $('npPlay').textContent = playing ? '❚❚' : '▶';
  $('npPlay').setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
  $('npShuffle').classList.toggle('active', state.shuffle);
  $('npRepeat').classList.toggle('active', state.repeat);
  $('npLike').classList.toggle('liked', Boolean(track && hasLike(track.id)));
  $('npLike').setAttribute('aria-label', track && hasLike(track.id) ? 'Remover dos favoritos' : 'Adicionar faixa às favoritas');
  $('npLike').firstChild.textContent = track && hasLike(track.id) ? '♥ ' : '♡ ';
  $('npDuration').textContent = $('duration').textContent;
  const key = track ? String(track.id) + ':' + String(track.artwork || '') : 'empty';
  if (key !== lastDialogArtKey) {
    const art = track && safeUrl(track.artwork);
    $('npArtwork').innerHTML = art ? '<img src="' + safe(art) + '" alt=""/>' : '<span>♫</span>';
    lastDialogArtKey = key;
  }
}
function syncExpandedProgress() {
  const p = Number($('progress').value) || 0;
  $('npCurrentTime').textContent = $('currentTime').textContent;
  $('npDuration').textContent = $('duration').textContent;
  $('npProgress').value = String(p);
  $('npProgress').style.setProperty('--progress', p + '%');
}
function openNowPlaying() {
  if (!$('nowPlayingDialog').open) {
    updateNowPlaying(state.current);
    syncExpandedProgress();
    $('nowPlayingDialog').showModal();
  }
}
function updatePlayer(){
 const track=state.current;$('playerTitle').textContent=track?track.title:'Escolha uma música';$('playerArtist').textContent=track?track.artist:'Seu flow começa aqui';
  const artKey=track?String(track.id)+':'+String(track.artwork||''):'empty';
  if (artKey !== lastPlayerArtKey) {
    const art=track&&safeUrl(track.artwork);
    $('playerArt').innerHTML=art?'<img src="'+safe(art)+'" alt=""/>':'<span>♫</span>';
    lastPlayerArtKey=artKey;
  }
 $('playerLike').classList.toggle('liked',track?hasLike(track.id):false);$('playerLike').textContent=track&&hasLike(track.id)?'♥':'♡';$('playButton').textContent=state.isPlaying?'❚❚':'▶';$('playButton').setAttribute('aria-label',state.isPlaying?'Pausar':'Reproduzir');$('shuffleButton').classList.toggle('active',state.shuffle);$('repeatButton').classList.toggle('active',state.repeat);$('duration').textContent=time(Number.isFinite(audio.duration)?audio.duration:track?.duration||0);document.title=(track?track.title+' — ':'')+'DEVBEAT — Code Your Rhythm';updateNowPlaying(track);syncExpandedProgress();
 if('mediaSession' in navigator && track){try{navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.artist,album:'DEVBEAT · Audius',artwork:track.artwork?[{src:safeUrl(track.artwork),sizes:'480x480',type:'image/jpeg'}]:[]});}catch{}}
}
async function play(track,queue){
 if(!track)return;state.queue=queue&&queue.length?queue:[track];state.index=state.queue.findIndex(t=>String(t.id)===String(track.id));if(state.index<0){state.queue.push(track);state.index=state.queue.length-1;}
 state.current=track;state.isPlaying=false;audio.pause();audio.src=trackStreamUrl(track.id);audio.load();state.playback={track,position:0};updateResume();persistLibrary();updatePlayer();renderTracks();
 try{await audio.play();state.isPlaying=true;updatePlayer();}catch(e){state.isPlaying=false;updatePlayer();if(e.name!=='AbortError')flash('Não foi possível reproduzir esta faixa. Tente outra.');}
}
function togglePlay(){if(!state.current){const first=getVisibleTracks()[0];if(first)play(first,getVisibleTracks());else flash('Escolha uma faixa primeiro');return;}if(audio.paused){audio.play().then(()=>{state.isPlaying=true;updatePlayer();}).catch(()=>flash('Reprodução indisponível para esta faixa'));}else{audio.pause();state.isPlaying=false;updatePlayer();}}
function skip(direction){if(!state.queue.length)return;let next;if(state.shuffle&&state.queue.length>1){next=state.index;while(next===state.index)next=Math.floor(Math.random()*state.queue.length);}else next=(state.index+direction+state.queue.length)%state.queue.length;play(state.queue[next],state.queue);}
function refresh(){if(state.view==='liked'||state.view==='playlist'||state.view==='history'){renderTracks();return;}if($('searchInput').value.trim())loadTracks('search',$('searchInput').value.trim());else if(state.mode){const m=modes.find(x=>x.id===state.mode);loadTracks('search',m.query);}else loadTracks('trending');}
function handleSearch(term){state.view='discover';state.mode=null;renderNav();renderModes();$('hero').hidden=true;$('flowSection').hidden=true;setHeading('RESULTADOS DA BUSCA','Sua <span>pesquisa</span>','Músicas e artistas encontrados no Audius.');loadTracks('search',term);}
function addHistory(track){if(!track||(state.user&&!state.cloudReady))return;const last=state.history[0];if(last&&String(last.id)===String(track.id)&&Date.now()-(last.playedAt||0)<120000)return;state.history=[{...track,playedAt:Date.now()},...state.history.filter(t=>String(t.id)!==String(track.id))].slice(0,80);persistLibrary();if(state.view==='history')renderTracks();}
function savePlaybackPosition(){if(!state.current||(state.user&&!state.cloudReady))return;state.playback={track:state.current,position:Math.floor(audio.currentTime)||0};updateResume();persistLibrary();}
function displayAccount(){const user=state.user;$('accountButton').textContent=user?'☁ '+(user.email||'Conta').split('@')[0].slice(0,13):(cloudConfigured?'Entrar / Cadastrar':'☁ Conta');$('accountButton').title=user?'Biblioteca sincronizada':'Acesso a contas e sincronização';$('authLogout').hidden=!user;$('authFields').hidden=!!user;$('authSubmit').hidden=!!user;$('authSwitch').hidden=!!user;$('authReset').hidden=!!user;$('accountTitle').textContent=user?'Minha conta DEVBEAT':'Entrar no DEVBEAT';$('accountNotice').textContent=user?'Sua biblioteca está vinculada a '+(user.email||'esta conta'):cloudConfigured?'Entre ou crie uma conta para salvar músicas na nuvem.':'Recurso preparado. Falta conectar um projeto Supabase dedicado ao DEVBEAT.';if(!cloudConfigured){$('authFields').hidden=true;$('authSubmit').hidden=true;$('authSwitch').hidden=true;$('authReset').hidden=true;}}
async function onAuthChanged(user,event){if(user&&state.user?.id===user.id&&event!=='INITIAL_SESSION'&&event!=='PASSWORD_RECOVERY')return;const epoch=++state.authEpoch;clearTimeout(state.syncTimer);if(event==='PASSWORD_RECOVERY'){const password=prompt('Defina sua nova senha (mínimo de 8 caracteres):');if(password&&password.length>=8)try{await updatePassword(password);flash('Sua senha foi atualizada.');}catch(e){flash(e.message);}return;}
  if(!user){
    state.user=null; state.cloudReady=false; pendingCloudSave=null;
    clearSessionPlayer(); adoptLibrary(guestLibrary);
    state.name=guestName; updateName(); displayAccount(); return;
  }
  if(state.user?.id===user.id&&!['INITIAL_SESSION'].includes(event))return;
  state.user=user; state.cloudReady=false; pendingCloudSave=null;
  clearSessionPlayer(); adoptLibrary(cleanLibrary({}));
  state.name='DEV'; updateName(); displayAccount();
  try {
    let lib=await readCloudLibrary(user.id); if(epoch!==state.authEpoch)return;
    const pending=storage.get(pendingKey(user.id),null);
    if(pending?.userId===user.id && pending.library){
      if(confirm('Há alterações musicais deste usuário que não foram sincronizadas. Recuperar e enviar para a nuvem? Isso substituirá a versão online.')){
        const recovered=cleanLibrary(pending.library);
        await writeCloudLibrary(user.id,recovered);
        lib=recovered;
      }
      storage.set(pendingKey(user.id),null);
    }
    if(!lib){
      const hasLocal=Object.keys(guestLibrary.favorites).length||guestLibrary.playlists.some(p=>p.tracks.length)||guestLibrary.history.length;
      lib=hasLocal&&confirm('Importar músicas e playlists deste dispositivo para a nova conta DEVBEAT?')?guestLibrary:cleanLibrary({});
      await writeCloudLibrary(user.id,lib);
    }
    if(epoch!==state.authEpoch)return;
    const profile=await readCloudProfile(user.id);
    if(epoch!==state.authEpoch)return;
    const defaultName=normalizeDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0]);
    if(!profile) await saveCloudProfile(user.id,defaultName);
    if(epoch!==state.authEpoch)return;
    state.name=profile||defaultName; updateName(); adoptLibrary(lib); state.cloudReady=true;
    flash('Sua biblioteca está sincronizada ✓');
  }catch(e){if(epoch===state.authEpoch)flash('Não foi possível carregar a biblioteca: '+String(e.message||'erro'));}
}
function wireEvents(){
 document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
 $('modeGrid').addEventListener('click',e=>{const el=e.target.closest('[data-mode]');if(el)selectMode(el.dataset.mode);});
 $('sidebarModes').addEventListener('click',e=>{const el=e.target.closest('[data-mode]');if(el)selectMode(el.dataset.mode);});
 $('tracksList').addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const row=button.closest('[data-id]');if(!row)return;const track=getVisibleTracks().find(t=>String(t.id)===row.dataset.id);if(!track)return;switch(button.dataset.action){case 'play': if(state.current&&String(state.current.id)===String(track.id))togglePlay();else play(track,getVisibleTracks());break;case 'like':toggleLike(track);break;case 'add':togglePlaylist(track);break;}});
 $('refreshButton').addEventListener('click',refresh);
 $('loadMoreButton').addEventListener('click',loadMore);
 $('genreFilters').addEventListener('click',e=>{const b=e.target.closest('[data-genre]');if(!b)return;const q=b.dataset.genre;if(q)handleSearch(q);else setView('discover');});
 $('playlistSelect').addEventListener('change',e=>{if(!canEditLibrary())return;const p=state.playlists.find(p=>p.id===e.target.value);if(!p)return;state.selectedPlaylistId=p.id;state.playlist=p.tracks;persistLibrary();renderTracks();});
 $('newPlaylistButton').addEventListener('click',()=>{if(!canEditLibrary())return;const name=prompt('Nome da nova playlist (até 50 caracteres):');if(!name?.trim())return;if(state.playlists.length>=30){flash('Limite de 30 playlists atingido');return;}const id='list-'+(crypto.randomUUID?.()||Date.now());const p={id,name:name.trim().slice(0,50),tracks:[]};state.playlists.push(p);state.selectedPlaylistId=id;state.playlist=p.tracks;persistLibrary();renderPlaylistSelect();renderTracks();flash('Playlist criada!');});
 $('deletePlaylistButton').addEventListener('click',()=>{if(!canEditLibrary())return;if(state.playlists.length===1){flash('Mantenha ao menos uma playlist');return;}if(!confirm('Excluir esta playlist?'))return;state.playlists=state.playlists.filter(p=>p.id!==state.selectedPlaylistId);state.selectedPlaylistId=state.playlists[0].id;state.playlist=state.playlists[0].tracks;persistLibrary();renderPlaylistSelect();renderTracks();});
 $('resumeButton').addEventListener('click',async()=>{const saved=state.playback;if(!saved?.track)return;await play(saved.track,[saved.track]);if(saved.position>0){const seek=()=>{try{audio.currentTime=Math.min(saved.position,Math.max(0,audio.duration-1));}catch{}};if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});}});
 $('startFlowButton').addEventListener('click',()=>{const first=state.tracks[0];if(first)play(first,state.tracks);else selectMode('deep');});
 $('exploreModesButton').addEventListener('click',()=>setView('codeflow'));
 $('allModesButton').addEventListener('click',()=>setView('codeflow'));
 $('focusButton').addEventListener('click',()=>selectMode('deep'));
 $('playButton').addEventListener('click',togglePlay);
  $('playerArt').addEventListener('click',openNowPlaying);
  $('expandPlayerButton').addEventListener('click',openNowPlaying);
  $('npCloseButton').addEventListener('click',()=> $('nowPlayingDialog').close());
  $('npPlay').addEventListener('click',togglePlay);
  $('npPrevious').addEventListener('click',()=>skip(-1));
  $('npNext').addEventListener('click',()=>skip(1));
  $('npLike').addEventListener('click',()=>toggleLike(state.current));
  $('npShuffle').addEventListener('click',()=>{$('shuffleButton').click();});
  $('npRepeat').addEventListener('click',()=>{$('repeatButton').click();});
  $('npProgress').addEventListener('input',e=>{
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime=Number(e.target.value)*audio.duration/100;
    syncExpandedProgress();
  });
 $('previousButton').addEventListener('click',()=>skip(-1));$('nextButton').addEventListener('click',()=>skip(1));
 $('shuffleButton').addEventListener('click',()=>{state.shuffle=!state.shuffle;updatePlayer();flash(state.shuffle?'Modo aleatório ativado':'Modo aleatório desativado');});
 $('repeatButton').addEventListener('click',()=>{state.repeat=!state.repeat;updatePlayer();flash(state.repeat?'Repetição ativada':'Repetição desativada');});
 $('playerLike').addEventListener('click',()=>toggleLike(state.current));$('playlistCurrentButton').addEventListener('click',()=>togglePlaylist(state.current));
 $('volume').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;});
 $('progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)*audio.duration/100;});
 let searchTimer;$('searchInput').addEventListener('input',e=>{clearTimeout(searchTimer);const term=e.target.value.trim();searchTimer=setTimeout(()=>{if(term.length>=2)handleSearch(term);else if(!term)setView('discover');},400);});
 $('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(searchTimer);const q=e.target.value.trim();if(q)handleSearch(q);}});
 $('menuButton').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menuButton').setAttribute('aria-expanded',String(open));});
 $('accountButton').addEventListener('click',()=>{displayAccount();$('accountDialog').showModal();});
 $('closeAccountButton').addEventListener('click',()=>$('accountDialog').close());
 $('authSwitch').addEventListener('click',()=>{state.authMode=state.authMode==='login'?'register':'login';$('authSubmit').textContent=state.authMode==='login'?'Entrar':'Criar conta';$('authSwitch').textContent=state.authMode==='login'?'Criar uma conta':'Já tenho conta';$('authDisplayName').hidden=state.authMode!=='register';$('authNameLabel').hidden=state.authMode!=='register';$('authPassword').autocomplete=state.authMode==='login'?'current-password':'new-password';});
 $('accountForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('authEmail').value.trim(),password=$('authPassword').value;const btn=$('authSubmit');btn.disabled=true;try{const data=await authAction(state.authMode,email,password,$('authDisplayName').value.trim());$('authMessage').textContent=state.authMode==='register'&&!data.session?'Verifique seu e-mail para confirmar o cadastro.':'Acesso autorizado.';if(data.session)$('accountDialog').close();}catch(err){$('authMessage').textContent=String(err.message||'Não foi possível autenticar');}finally{btn.disabled=false;}});
 $('authReset').addEventListener('click',async()=>{const email=$('authEmail').value.trim();if(!email){$('authMessage').textContent='Informe seu e-mail primeiro.';return;}try{await authAction('reset',email,'');$('authMessage').textContent='Se o endereço estiver cadastrado, você receberá um e-mail de recuperação.';}catch(e){$('authMessage').textContent=String(e.message);}});
 $('authLogout').addEventListener('click',async()=>{try{clearTimeout(state.syncTimer);if(!await flushCloud()){flash('Sincronização pendente. Verifique a conexão antes de sair.');return;}await signOut();$('accountDialog').close();}catch(e){flash(String(e.message||'Falha ao sair'));}});
 $('profileButton').addEventListener('click',()=>{$('displayName').value=state.name==='DEV'?'':state.name;$('profileDialog').showModal();});
 $('saveProfileButton').addEventListener('click',()=>{const newName=$('displayName').value.trim().slice(0,30);state.name=newName||'DEV';if(state.user)saveCloudProfile(state.user.id,state.name).catch(()=>flash('Perfil ainda não sincronizado'));else {guestName=state.name;storage.set('name',state.name);}updateName();flash('Perfil atualizado');});
 audio.addEventListener('play',()=>{state.isPlaying=true;addHistory(state.current);updatePlayer();});audio.addEventListener('pause',()=>{state.isPlaying=false;savePlaybackPosition();updatePlayer();});
 audio.addEventListener('timeupdate',()=>{const p=audio.duration?100*audio.currentTime/audio.duration:0;$('progress').value=String(p);$('progress').style.setProperty('--progress',p+'%');$('currentTime').textContent=time(audio.currentTime);syncExpandedProgress();});
 audio.addEventListener('loadedmetadata',updatePlayer);let lastProgressSave=0;audio.addEventListener('timeupdate',()=>{if(Date.now()-lastProgressSave>25000&&state.current&&state.isPlaying){lastProgressSave=Date.now();savePlaybackPosition();}});audio.addEventListener('ended',()=>{if(state.repeat){audio.currentTime=0;audio.play().catch(()=>{});}else skip(1);});
 audio.addEventListener('error',()=>{if(state.current){state.isPlaying=false;updatePlayer();flash('Esta faixa está indisponível no Audius. Escolha outra.');}});
 document.addEventListener('keydown',e=>{const tag=document.activeElement?.tagName;if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(tag)&&!document.querySelector('dialog[open]')){e.preventDefault();$('searchInput').focus();return;}if(['INPUT','TEXTAREA'].includes(tag)||$('profileDialog').open||$('accountDialog').open||$('nowPlayingDialog').open)return;if(e.code==='Space'&&!e.repeat){e.preventDefault();togglePlay();}if(e.altKey&&e.key==='ArrowRight')skip(1);if(e.altKey&&e.key==='ArrowLeft')skip(-1);});
 if('mediaSession' in navigator){try{navigator.mediaSession.setActionHandler('play',togglePlay);navigator.mediaSession.setActionHandler('pause',togglePlay);navigator.mediaSession.setActionHandler('previoustrack',()=>skip(-1));navigator.mediaSession.setActionHandler('nexttrack',()=>skip(1));}catch{}}
}
renderModes();updateName();updateResume();renderPlaylistSelect();wireEvents();displayAccount();loadTracks('trending');listenToAuth(onAuthChanged).catch(e=>flash('Login indisponível: '+String(e.message||'erro')));
