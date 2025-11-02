/* ========= UI helpers ========= */
const UI = {
  toast(t){ const el=document.createElement('div'); el.textContent=t; Object.assign(el.style,{position:'fixed',left:'50%',bottom:'84px',transform:'translateX(-50%)',background:'var(--card)',border:'1px solid var(--line)',padding:'10px 14px',borderRadius:'10px',zIndex:95,boxShadow:'var(--shadow)',animation:'fadeUp .16s ease'}); document.body.appendChild(el); setTimeout(()=>el.remove(),1600); },
  showSearch(){ document.getElementById('searchModal').style.display='block'; document.getElementById('searchInput').focus() },
  hideSearch(){ document.getElementById('searchModal').style.display='none'; },
  ad(label='광고/배너 위치'){ return `<div class="ad">(${label})</div>`; }
};

window.UI = UI; // [moduleized]
