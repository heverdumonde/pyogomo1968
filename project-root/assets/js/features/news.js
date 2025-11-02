/* ========= News ========= */
function ViewNews(){
  const isAdmin = Auth.isAdmin();
  Router.mount.innerHTML = `
    <section class="section">
      <div class="split" style="align-items:center;justify-content:space-between">
        <h2>표선고 소식</h2>
        ${isAdmin?`<span class="chip">권한: 관리자</span>`:`<span class="chip">읽기 전용</span>`}
      </div>
      <div id="newsArea"></div>
      ${isAdmin?`
      <div class="card" style="margin-top:12px">
        <strong>기사 작성</strong><div class="muted tiny">관리자 계정: admin@pyoseon.hs.kr</div><div class="line"></div>
        <div class="split" style="gap:8px;align-items:center">
          <input id="nSection" placeholder="섹션(예: 캠퍼스/학생회)" class="btn" style="flex:1"/>
          <input id="nTitle" placeholder="제목" class="btn" style="flex:2"/>
        </div>
        <div class="split" style="gap:8px;margin-top:8px">
          <input id="nLead" placeholder="리드(요약 1~2문장)" class="btn" style="flex:1"/>
          <input id="nThumb" placeholder="썸네일 URL(선택)" class="btn" style="flex:1"/>
        </div>
        <textarea id="nBody" placeholder="본문(줄바꿈 유지)" class="btn" style="width:100%;min-height:120px;margin-top:8px"></textarea>
        <div class="split" style="gap:8px;margin-top:8px;align-items:center">
          <button class="btn" onclick="News.insertTemplate()">템플릿</button>
          <button class="btn" onclick="News.sampleThumb()">샘플 썸네일</button>
          <button class="btn pri" onclick="News.save()">발행</button>
        </div>
      </div>`:''}
    </section>`;
  News.initFromHash();
}
const News = {
  currentId:null,
  autoThumb(seed='NEWS'){
    const txt = encodeURIComponent(seed.slice(0,6).toUpperCase());
    return `data:image/svg+xml;utf8,<?xml version='1.0'?><svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230e2148'/><stop offset='100%' stop-color='%23122a54'/></linearGradient></defs><rect width='640' height='360' rx='16' fill='url(%23g)'/><text x='50%25' y='53%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='64' font-family='Segoe UI, Arial, sans-serif'>${txt}</text></svg>`;
  },
  readingTime(text){ const w=(text.trim().split(/\s+/).filter(Boolean).length)||0; const min=Math.max(1,Math.round(w/250)); return `${min}분 소요`; },
  when(ts){ if(!ts) return ''; const s=Math.floor((Date.now()-ts)/1000); if(s<60) return `${s}초 전`; if(s<3600) return `${Math.floor(s/60)}분 전`; if(s<86400) return `${Math.floor(s/3600)}시간 전`; return `${Math.floor(s/86400)}일 전`; },
  renderList(){
    const area=document.getElementById('newsArea'); const list=Store.get('news',[]).sort((a,b)=> (b.ts||0)-(a.ts||0));
    area.innerHTML = (list.length? `<div class="news-wrap">
      ${list.map(n=>`<article class="news-card" onclick="News.open('${n.id}')">
        <img class="news-thumb" alt="thumb" src="${n.thumb||this.autoThumb(n.section||'NEWS')}"/>
        <div>
          <div class="muted tiny">${n.section||'소식'} · <span>${n.date||''}</span></div>
          <h3 class="news-title">${CT.escape(n.title)}</h3>
          <div class="news-meta">관리자 · ${this.readingTime(n.body||'')} · ${this.when(n.ts)}</div>
          <p class="news-lead">${CT.escape(n.lead||'')}</p>
          ${Auth.isAdmin()?`<div class="tiny" style="margin-top:6px"><button class="btn" onclick="event.stopPropagation();News.remove('${n.id}')">🗑 삭제</button></div>`:''}
        </div>
      </article>`).join('')}
    </div>` : `<div class="card"><div class="muted">발행된 기사가 없습니다.</div></div>`);
  },
  renderArticle(id){
    const area=document.getElementById('newsArea'); const n=(Store.get('news',[]).find(x=>x.id===id)); if(!n){ this.currentId=null; return this.renderList(); }
    area.innerHTML = `
      <article class="article">
        <img class="hero" alt="hero" src="${n.thumb||this.autoThumb(n.section||'NEWS')}"/>
        <div class="pad">
          <div class="muted tiny">${n.section||'소식'} · ${n.date||''} · ${this.readingTime(n.body||'')}</div>
          <h1>${CT.escape(n.title)}</h1>
          <div class="by">관리자 (${n.authorEmail})</div>
          <div class="body">${(n.body||'').replace(/</g,'&lt;')}</div>
          <div class="actions">
            <button class="btn" onclick="navigator.clipboard?.writeText(location.origin+location.pathname+'#news-${n.id}'); UI.toast('링크 복사됨')">🔗 공유</button>
            <button class="btn" onclick="News.back()">← 목록으로</button>
            ${Auth.isAdmin()?`<button class="btn" onclick="News.remove('${n.id}')">🗑 삭제</button>`:''}
          </div>
        </div>
      </article>`;
    location.hash = `news-${id}`;
  },
  open(id){ this.currentId=id; this.renderArticle(id); },
  back(){ this.currentId=null; location.hash='#news'; this.renderList(); },
  save(){
    if(!Auth.isAdmin()) return UI.toast('권한이 없습니다');
    const me=Auth.user();
    const section = document.getElementById('nSection').value.trim();
    const title   = document.getElementById('nTitle').value.trim();
    const lead    = document.getElementById('nLead').value.trim();
    const thumb   = document.getElementById('nThumb').value.trim();
    const body    = document.getElementById('nBody').value.trim();
    if(!title || !body) return UI.toast('제목/본문을 입력하세요');
    const list=Store.get('news',[]); const id=crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    list.push({id, section, title, lead, thumb, body, authorEmail:me.email, authorName:me.name, date:fmtDate(now()), ts: Date.now()});
    Store.set('news', list); UI.toast('발행 완료'); this.currentId=null; ViewNews();
  },
  remove(id){
    if(!Auth.isAdmin()) return UI.toast('삭제 권한이 없습니다');
    const list=Store.get('news',[]); Store.set('news', list.filter(x=>x.id!==id)); UI.toast('삭제되었습니다'); this.currentId=null; this.renderList();
  },
  initFromHash(){
    const h=location.hash; const m=h.match(/^#news-(.+)$/);
    if(m){ this.currentId=m[1]; this.renderArticle(this.currentId); }
    else { this.currentId=null; this.renderList(); }
  },
  insertTemplate(){
    const t = `기사 리드 한 문장으로 핵심 요약.\n\n- 소제목 1\n내용 단락 1\n\n- 소제목 2\n내용 단락 2\n`;
    const el=document.getElementById('nBody'); el.value = (el.value? el.value+'\n':'') + t; el.focus();
  },
  sampleThumb(){
    const el=document.getElementById('nThumb'); el.value = this.autoThumb('NEWS');
  }
};

window.ViewNews = ViewNews; // [moduleized]
window.News = News;         // [moduleized]
