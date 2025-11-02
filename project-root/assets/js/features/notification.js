/* ========= Notifications ========= */
const Noti = {
  list(){ return Store.get('notifs',{personal:[],global:[]}) },
  set(v){ Store.set('notifs', v) },
  add(kind, text){ const n=this.list(); const item={id:crypto.randomUUID?.()||Math.random().toString(36).slice(2), text, ts:Date.now(), read:false};
                   n[kind]=[item, ...n[kind]]; this.set(n); this.updateBadge(); },
  broadcast(text){ if(!Auth.isAdmin()) return; this.add('global', text); UI.toast('전체 알림 발송'); },
  unreadCount(){ const n=this.list(); const p=n.personal.filter(x=>!x.read).length; const g=n.global.filter(x=>!x.read).length; return p+g; },
  updateBadge(){ const c=this.unreadCount(); const badge=document.getElementById('bellBadge'); badge.textContent=c; badge.style.display = c>0?'inline-block':'none'; },
  openPanel(){
    const panel=document.getElementById('notiPanel'); panel.style.display = panel.style.display==='block'?'none':'block';
    document.getElementById('notiAdmin').style.display = Auth.isAdmin()? 'block':'none';
    this.renderList('personal');
  },
  renderList(kind){
    const box=document.getElementById('notiList'); const n=this.list()[kind]; const fmt=(ts)=>{const s=Math.floor((Date.now()-ts)/1000); if(s<60)return s+'초 전'; if(s<3600)return Math.floor(s/60)+'분 전'; if(s<86400)return Math.floor(s/3600)+'시간 전'; return Math.floor(s/86400)+'일 전'};
    if(!n.length){ box.innerHTML='<div class="empty">알림이 없습니다.</div>'; } else {
      box.innerHTML = `
        <div class="split" style="justify-content:flex-end;padding:0 4px 4px"><button class="btn" onclick="Noti.clear('${kind}')">표시된 목록 삭제</button></div>
        ${n.map(i=>`<div class="item"><div>${CT.escape(i.text)}<div class="tiny muted" style="margin-top:4px">${fmt(i.ts)}</div></div><button class="del" onclick="Noti.remove('${kind}','${i.id}')">삭제</button></div>`).join('')}`;
      // mark read
      const all=this.list(); all[kind]=all[kind].map(x=>({...x, read:true})); this.set(all); this.updateBadge();
    }
  },
  remove(kind,id){ const all=this.list(); all[kind]=all[kind].filter(x=>x.id!==id); this.set(all); this.renderList(kind); },
  clear(kind){ const all=this.list(); all[kind]=[]; this.set(all); this.renderList(kind); }
};

window.Noti = Noti; // [moduleized]
