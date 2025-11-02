/* ========= Community ========= */
function ViewCommunity(){
  const c = CT; Router.mount.innerHTML = `
    <section class="section">
      <div class="ct-wrap">
        <div class="ct-topbar">
          <div class="ct-logo">Pyo<b>Gomo</b></div>
          <div class="ct-search"><input id="ctQ" placeholder="검색 (글, 댓글, 작성자)"/><button id="ctBtnSearch">검색</button></div>
          <div class="muted tiny" id="ctWho">—</div>
        </div>
        <div class="ct-tabs" id="ctTabs"></div>
        <div>
          <div class="ct-composer">
            <div class="ct-avatar"></div>
            <input id="ctQuick" placeholder="무슨 생각 중인가요? (클릭하여 글쓰기)" readonly />
            <button class="btn pri" id="ctOpen">글쓰기</button>
          </div>
          <div id="ctFeed" class="ct-feed"></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px"><div class="muted tiny">커뮤니티 하단 배너</div></div>
    </section>`;
  c.ui.init();
}
const CT = {
  key:'campustime_state_v1',
  get(){ try{ return JSON.parse(localStorage.getItem(this.key))||null }catch{ return null } },
  set(v){ localStorage.setItem(this.key, JSON.stringify(v)) },
  me(){ return Auth.user() },
  timeAgo(ts){ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return `${s}초 전`; if(s<3600)return `${Math.floor(s/60)}분 전`; if(s<86400)return `${Math.floor(s/3600)}시간 전`; return `${Math.floor(s/86400)}일 전`; },
  escape(s){ return (s||'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]) ) },
  defaultBoards:['자유게시판','정보게시판','질문게시판','홍보게시판','비밀게시판'],
  ui:{
    init(){
      if(!CT.get()) localStorage.setItem(CT.key, JSON.stringify({boards:CT.defaultBoards,activeBoard:'전체',posts:[],noti:0}));
      this.state = CT.get(); this.renderTabs(); this.renderFeed(); this.bind();
      const u=CT.me(); document.getElementById('ctWho').textContent = u? `${u.name} (${u.email})` : '—';
    },
    bind(){
      document.getElementById('ctOpen').onclick = ()=>this.openWrite();
      document.getElementById('ctQuick').onclick= ()=>this.openWrite();
      document.getElementById('ctBtnSearch').onclick = ()=>{ const q=document.getElementById('ctQ').value.trim(); this.renderFeed(q) };
      document.getElementById('ctQ').addEventListener('keydown',e=>{ if(e.key==='Enter') this.renderFeed(e.target.value.trim()) });
      document.getElementById('ctCancel').onclick = ()=> this.closeWrite();
      document.getElementById('ctSubmit').onclick = ()=> this.submit();
    },
    renderTabs(){
      const tabs=document.getElementById('ctTabs'); tabs.innerHTML='';
      const all=['전체', ...this.state.boards];
      all.forEach(name=>{
        const el=document.createElement('button');
        el.className='ct-tab'+(this.state.activeBoard===name?' active':''); el.textContent=name;
        el.onclick=()=>{ this.state.activeBoard=name; CT.set(this.state); this.renderTabs(); this.renderFeed(); };
        tabs.appendChild(el);
      });
    },
    renderFeed(query=''){
      const feed=document.getElementById('ctFeed'); let posts=[...this.state.posts];
      if(this.state.activeBoard!=='전체') posts=posts.filter(p=>p.board===this.state.activeBoard);
      if(query){ const k=query.toLowerCase(); posts=posts.filter(p=> (p.title+p.body+p.authorName).toLowerCase().includes(k) || (p.comments||[]).some(c=>(c.who+c.text).toLowerCase().includes(k))); }
      feed.innerHTML = posts.length? '' : `<div class="ct-empty">게시글이 없습니다.</div>`;
      posts.forEach(p=> feed.appendChild(this.postCard(p)) );
    },
    postCard(p){
      const me=CT.me(); const canDel = Auth.isAdmin() || (me && me.email===p.authorEmail);
      const myReaction = (p.reactions && Object.entries(p.reactions).find(([emo,arr])=>arr.includes(me?.email||'')))?.[0] || null;
      const count = (emo)=> (p.reactions?.[emo]?.length||0);
      const emolist = ['👍','😂','🥹','🎉','❤️'];
      const card=document.createElement('article'); card.className='ct-card';
      card.innerHTML = `
        <div class="head">
          <div class="ct-avatar"></div>
          <div>
            <div><b>${CT.escape(p.authorName)}</b> · <span class="ct-meta">${CT.escape(p.board)}</span></div>
            <div class="ct-meta">${CT.timeAgo(p.ts)}</div>
          </div>
        </div>
        ${p.title?`<div class="ct-title">${CT.escape(p.title)}</div>`:''}
        <div class="ct-body">${CT.escape(p.body)}</div>
        <div class="ct-actions">
          <div class="ct-reactions">
            ${emolist.map(emo=>`<button data-emo="${emo}" class="${myReaction===emo?'active':''}">${emo} <span>${count(emo)}</span></button>`).join('')}
          </div>
          <button data-act="comment">💬 <span>${(p.comments||[]).length}</span></button>
          <button data-act="share">🔗 공유</button>
          ${canDel?`<button data-act="del" style="margin-left:auto">🗑 삭제</button>`:''}
        </div>
        <div class="ct-comments">
          ${(p.comments||[]).map(c=>`
            <div class="ct-comment">
              <div class="ct-avatar"></div>
              <div class="ct-bubble"><div class="who">${CT.escape(c.who)}</div>${CT.escape(c.text)}</div>
            </div>`).join('')}
          <div class="ct-comment">
            <div class="ct-avatar"></div>
            <div style="display:flex;gap:8px;width:100%">
              <input placeholder="댓글 쓰기" style="flex:1;background:var(--chip);border:1px solid var(--line);color:var(--ink);padding:8px 10px;border-radius:12px" />
              <button class="ctAddCmt" style="background:var(--pri);color:var(--pri-ink);border:0;padding:8px 12px;border-radius:12px;font-weight:700">등록</button>
            </div>
          </div>
        </div>`;
      // Reaction handlers
      card.querySelectorAll('.ct-reactions button').forEach(btn=>{
        btn.onclick=()=>{
          const emo=btn.dataset.emo; const me=CT.me(); if(!me){ UI.toast('로그인이 필요합니다'); return; }
          p.reactions = p.reactions || {};
          // remove existing my reaction
          Object.keys(p.reactions).forEach(k=>{
            p.reactions[k] = (p.reactions[k]||[]).filter(e=>e!==me.email);
          });
          // toggle if same clicked
          if(myReaction!==emo){
            p.reactions[emo] = p.reactions[emo]||[]; p.reactions[emo].push(me.email);
          }
          CT.set(this.state); this.renderFeed();
        };
      });
      // Other actions
      const [btnCmt, btnShare, btnDel] = card.querySelectorAll('.ct-actions button[data-act]');
      if(btnCmt) btnCmt.onclick = ()=> card.querySelector('.ct-comments input').focus();
      if(btnShare) btnShare.onclick= ()=>{ navigator.clipboard?.writeText(location.origin+location.pathname+'#post-'+p.id); UI.toast('링크 복사됨'); };
      if(btnDel) btnDel.onclick = ()=>{ if(confirm('이 글을 삭제할까요?')){ this.state.posts=this.state.posts.filter(x=>x.id!==p.id); CT.set(this.state); this.renderFeed(); } };
      // comment add
      card.querySelector('.ctAddCmt').onclick = ()=>{
        const input=card.querySelector('.ct-comments input'); const text=input.value.trim(); if(!text) return;
        p.comments=p.comments||[]; p.comments.push({who:(CT.me()?.name||'익명'), text}); input.value=''; CT.set(this.state); this.renderFeed();
      };
      return card;
    },
    openWrite(){
      const u=CT.me(); if(!u){ UI.toast('로그인이 필요합니다'); return; }
      document.getElementById('ctBoard').innerHTML = this.state.boards.map(b=>`<option>${b}</option>`).join('');
      document.getElementById('ctTitle').value=''; document.getElementById('ctBody').value=''; document.getElementById('ctAuthor').value = u? u.name : '익명';
      document.getElementById('ctModal').style.display='grid';
    },
    closeWrite(){ document.getElementById('ctModal').style.display='none'; },
    submit(){
      const u=CT.me(); if(!u){ UI.toast('로그인이 필요합니다'); return; }
      const post = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        board: document.getElementById('ctBoard').value,
        title: document.getElementById('ctTitle').value.trim(),
        body: document.getElementById('ctBody').value.trim(),
        authorName: document.getElementById('ctAuthor').value.trim() || u.name || '익명',
        authorEmail: u.email,
        ts: Date.now(), reactions:{}, comments:[]
      };
      if(!post.body) return UI.toast('내용을 입력하세요');
      this.state.posts.unshift(post); this.state.noti=(this.state.noti||0)+1; CT.set(this.state); this.closeWrite(); this.renderFeed(); UI.toast('등록되었습니다');
    }
  }
};

window.ViewCommunity = ViewCommunity; // [moduleized]
window.CT = CT; // [moduleized]
