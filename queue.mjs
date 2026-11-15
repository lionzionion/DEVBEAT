/** DEVBEAT 2.3 — operação de fila: sem DOM, testável em Node.js. */
export const QUEUE_LIMIT = 250;
const valid = track => Boolean(track && String(track.id || '').trim() && typeof track.title === 'string');
const equal = (a,b) => String(a?.id) === String(b?.id);
const indexSafe = (items,index) => Number.isInteger(index) ? Math.min(items.length-1,Math.max(-1,index)) : -1;
export function upcoming(queue,index) {
  const items = Array.isArray(queue) ? queue : [];
  return items.slice(indexSafe(items,index)+1);
}
export function playNext(queue,index,track) {
  const items = Array.isArray(queue) ? queue.slice() : [];
  const current = indexSafe(items,index);
  if (!valid(track) || (current >= 0 && equal(items[current],track))) {
    return { queue:items, index:current, changed:false };
  }
  const before = items.slice(0,current+1);
  const after = items.slice(current+1).filter(item => !equal(item,track));
  const result = [...before,track,...after].slice(0,QUEUE_LIMIT);
  return { queue:result, index:current, changed:result.some((item,i)=>i===current+1 && equal(item,track)) };
}
export function moveUpcoming(queue,index,position,direction) {
  const items = Array.isArray(queue) ? queue.slice() : [];
  const boundary = indexSafe(items,index);
  const target = position + direction;
  if (!Number.isInteger(position) || ![1,-1].includes(direction) ||
      position <= boundary || position >= items.length ||
      target <= boundary || target >= items.length || target < 0) {
    return { queue:items,changed:false };
  }
  [items[position],items[target]]=[items[target],items[position]];
  return { queue:items,changed:true };
}
export function removeUpcoming(queue,index,position) {
  const items = Array.isArray(queue) ? queue.slice() : [];
  const boundary=indexSafe(items,index);
  if (!Number.isInteger(position) || position<=boundary || position>=items.length) {
    return { queue:items,changed:false };
  }
  items.splice(position,1);
  return { queue:items,changed:true };
}
export function clearUpcoming(queue,index) {
  const items = Array.isArray(queue) ? queue : [];
  const boundary=indexSafe(items,index);
  const kept=items.slice(0,boundary+1);
  return {queue:kept,changed:kept.length!==items.length};
}
