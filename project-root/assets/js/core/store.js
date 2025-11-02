/* ========= Utils & Storage ========= */
const Store = {
  get(k, fallback){ try{ return JSON.parse(localStorage.getItem(k)) ?? fallback }catch{ return fallback } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) },
  del(k){ localStorage.removeItem(k) }
};
const fmtDate = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const now = ()=>new Date();
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

// Expose globals for backward-compat
window.Store = Store;    // [moduleized]
window.fmtDate = fmtDate;// [moduleized]
window.now = now;        // [moduleized]
window.sleep = sleep;    // [moduleized]
