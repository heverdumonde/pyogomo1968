/* ========= Gate UI ========= */
const gate = document.getElementById('gate');
const authError = document.getElementById('authError');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
document.getElementById('btnLogin').onclick = async()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPass').value;
  const auto  = document.getElementById('autoLogin').checked;
  try{ await Auth.login(email,pw,auto); authError.textContent=''; showApp(true); }catch(e){ authError.textContent=e.message }
};
document.getElementById('goSignup').onclick=(e)=>{e.preventDefault();loginForm.style.display='none';signupForm.style.display='block';authError.textContent='';};
document.getElementById('goLogin').onclick=(e)=>{e.preventDefault();signupForm.style.display='none';loginForm.style.display='block';authError.textContent='';};
document.getElementById('btnSignup').onclick = async()=>{
  try{
    const groups = ['A','B','C','D','E','F','G'].reduce((acc,g)=>{
      const v = document.getElementById('suG'+g).value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,3);
      acc[g]=v; return acc;
    },{});
    const data = {
      grade: document.getElementById('suGrade').value,
      name : document.getElementById('suName').value.trim(),
      email: document.getElementById('suEmail').value.trim(),
      cls  : document.getElementById('suClass').value,
      no   : document.getElementById('suNo').value,
      pw   : document.getElementById('suPw').value,
      pw2  : document.getElementById('suPw2').value,
      groups
    };
    await Auth.signup(data); authError.textContent=''; showApp(true);
  }catch(e){ authError.textContent = e.message }
};

function showApp(tryAuto=false){
  const s=Store.get('session',{email:null,auto:false}); const hasAuto=localStorage.getItem('autoLogin')==='1';
  if((tryAuto && hasAuto && s.email) || s.email){ gate.style.display='none'; applyUserTheme(); Router.render(); Noti.updateBadge(); }
  else{ gate.style.display='grid'; }
}
window.showApp = showApp; // [moduleized]

/* ========= Top buttons & Admin bind ========= */
document.getElementById('btnSearch').addEventListener('click', UI.showSearch);
document.getElementById('btnBell').addEventListener('click', ()=> Noti.openPanel());
document.getElementById('btnMy').addEventListener('click', ()=>{ location.hash='#me'; Router.render(); });

document.getElementById('notiPanel').querySelectorAll('.tabs button').forEach(btn=>{
  btn.onclick=()=>{ document.querySelectorAll('#notiPanel .tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); Noti.renderList(btn.dataset.kind); };
});
document.getElementById('btnBroadcast').onclick = ()=>{ const t=document.getElementById('notiMsg').value.trim(); if(!t) return; Noti.broadcast(t); document.getElementById('notiMsg').value=''; };
document.getElementById('btnClearAll').onclick = ()=>{ if(!Auth.isAdmin()) return; const all=Noti.list(); all.global=[]; Noti.set(all); Noti.renderList('global'); };

document.getElementById('btnAdmin').addEventListener('click', ()=>{ if(!Auth.isAdmin()) return; document.getElementById('adminPanel').style.display='block'; });
document.getElementById('btnAdminClose').addEventListener('click', ()=>{ document.getElementById('adminPanel').style.display='none'; });
document.getElementById('admAddBoard').addEventListener('click', ()=>{
  if(!Auth.isAdmin()) return; const name=document.getElementById('admBoardName').value.trim(); if(!name) return;
  const st=CT.get(); if(st.boards.includes(name)) return UI.toast('이미 존재');
  st.boards.push(name); localStorage.setItem(CT.key, JSON.stringify(st)); UI.toast('추가 완료');
});
document.getElementById('admResetBoards').addEventListener('click', ()=>{
  if(!Auth.isAdmin()) return; const st=CT.get(); st.boards=CT.defaultBoards; localStorage.setItem(CT.key, JSON.stringify(st)); UI.toast('복원 완료');
});
document.getElementById('admClearDemo').addEventListener('click', ()=>{
  if(!Auth.isAdmin()) return; localStorage.removeItem(CT.key); UI.toast('커뮤니티 초기화 완료');
});
document.getElementById('admGiveSampleNews').addEventListener('click', ()=>{
  if(!Auth.isAdmin()) return; const me=Auth.user(); const list=Store.get('news',[]); const id=crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  list.push({id, section:'공지', title:'샘플 기사', lead:'샘플 리드', thumb:News.autoThumb('SAMPLE'), body:'샘플 본문입니다.', authorEmail:me.email, authorName:me.name, date:fmtDate(now()), ts: Date.now()});
  Store.set('news', list); UI.toast('샘플 기사 발행'); if(location.hash==='#news') ViewNews();
});

/* ========= Hash & boot ========= */
window.addEventListener('hashchange', ()=>Router.render());
(function boot(){ showApp(true); })(); // auto login if available  // [moduleized]
