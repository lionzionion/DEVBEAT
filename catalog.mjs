/** API Audius - integração direta de leitura para GitHub Pages (sem servidor). */
export const API_ROOTS = Object.freeze([
  'https://api.audius.co/v1',
  'https://discoveryprovider.audius.co/v1'
]);
const APP_NAME='DEVBEAT_Web';

export function normalizeTrack(track) {
  if (!track || !track.id || !track.title || track.is_streamable === false) return null;
  const artwork=track.artwork||{};
  const candidate=artwork['480x480']||artwork['150x150']||artwork['1000x1000']||'';
  return {
    id:String(track.id),
    title:String(track.title).slice(0,220),
    artist:String(track.user?.name||track.user?.handle||'Artista').slice(0,180),
    genre:String(track.genre||'Música').slice(0,80),
    duration:Number(track.duration)||0,
    plays:Number(track.play_count)||0,
    artwork:typeof candidate==='string'&&candidate.startsWith('https://')?candidate:'',
    permalink:track.permalink?String(track.permalink):''
  };
}

export function trackStreamUrl(id) {
  const value=String(id??'');
  if (!/^[\w-]{1,100}$/.test(value)) throw new Error('Identificador de faixa inválido');
  return `${API_ROOTS[0]}/tracks/${encodeURIComponent(value)}/stream?app_name=${APP_NAME}`;
}

export async function fetchCatalog({type='trending',query='',limit=24,offset=0}={},fetcher=globalThis.fetch) {
  const kind=type==='search'?'search':'trending';
  const term=String(query).trim().slice(0,90);
  if(kind==='search'&&term.length<2)throw new Error('Digite ao menos 2 caracteres para pesquisar');
  const qp=new URLSearchParams({app_name:APP_NAME,limit:String(Math.min(30,Math.max(1,Number(limit)||24)))});
  qp.set('offset',String(Math.min(1000,Math.max(0,Number(offset)||0))));
  if(kind==='search')qp.set('query',term);else qp.set('time','week');
  let lastError;
  for(const root of API_ROOTS){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetcher(`${root}/tracks/${kind}?${qp}`,{headers:{Accept:'application/json'},signal:controller.signal});
      if(!response.ok)throw new Error(`Audius: HTTP ${response.status}`);
      const payload=await response.json();
      if(!Array.isArray(payload.data))throw new Error('Resposta Audius inválida');
      return payload.data.map(normalizeTrack).filter(Boolean);
    } catch(error){lastError=error;} finally{clearTimeout(timeout);}
  }
  throw new Error('Não foi possível consultar o Audius no navegador. Verifique sua conexão ou tente novamente.');
}
