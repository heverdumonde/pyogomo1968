/* ========= Timetable ========= */
const GROUP_SLOT_SETS = [
  /* Set 1 (기본) */ {A:[[1,0],[3,2]], B:[[2,1],[4,3]], C:[[0,2],[5,4]], D:[[3,0],[1,3]], E:[[4,1],[2,4]], F:[[5,2],[0,1]], G:[[1,4],[3,1]]},
  /* Set 2 */        {A:[[0,0],[2,2]], B:[[1,1],[3,3]], C:[[2,0],[4,2]], D:[[3,1],[5,3]], E:[[4,0],[1,4]], F:[[5,1],[0,3]], G:[[0,4],[2,1]]},
  /* Set 3 */        {A:[[1,2],[4,0]], B:[[2,3],[5,1]], C:[[0,1],[3,4]], D:[[3,2],[1,0]], E:[[4,3],[2,2]], F:[[5,4],[0,0]], G:[[1,1],[2,4]]},
  /* Set 4 */        {A:[[2,0],[5,2]], B:[[0,3],[3,1]], C:[[1,4],[4,2]], D:[[3,3],[1,2]], E:[[4,1],[2,3]], F:[[5,0],[0,2]], G:[[2,1],[4,4]]},
  /* Set 5 */        {A:[[0,2],[4,1]], B:[[1,3],[5,2]], C:[[2,4],[3,0]], D:[[3,2],[0,0]], E:[[4,3],[1,1]], F:[[5,4],[2,2]], G:[[1,0],[3,4]]},
  /* Set 6 */        {A:[[1,1],[4,3]], B:[[2,2],[5,0]], C:[[0,0],[3,2]], D:[[3,4],[2,1]], E:[[4,2],[1,3]], F:[[5,1],[0,4]], G:[[2,3],[4,0]]},
];
function buildGridFromSelections(selections, baseGrid=null, setIndex=0){
  const slotsMap = GROUP_SLOT_SETS[setIndex] || GROUP_SLOT_SETS[0];
  const grid = baseGrid? JSON.parse(JSON.stringify(baseGrid)) : [...Array(8)].map(()=>Array(5).fill(''));
  selections.forEach(sel=>{
    const slots = slotsMap[sel.group];
    if(!slots) return;
    slots.forEach(([p,d])=>{
      if(grid[p] && grid[p][d]==='') grid[p][d]=sel.subject;
      else{
        let pp=p; while(pp<grid.length && grid[pp][d]!=='') pp++;
        if(pp<grid.length) grid[pp][d]=sel.subject;
      }
    });
  });
  return grid;
}
const FIRST_GRADE_TEMPLATE = {
  '국어':[ [0,0],[2,2] ],
  '수학':[ [1,1],[3,3] ],
  '영어':[ [2,0],[4,2] ],
  '한국사':[ [0,3] ],
  '통합과학':[ [1,2],[5,4] ],
  '체육':[ [4,0] ],
};
function buildFirstGradeGrid(){
  const grid=[...Array(8)].map(()=>Array(5).fill(''));
  Object.entries(FIRST_GRADE_TEMPLATE).forEach(([sub,slots])=>{
    slots.forEach(([p,d])=>{ grid[p][d]=sub; });
  });
  return grid;
}

function ViewTimetable(){
  const tt=Store.get('timetable');
  Router.mount.innerHTML = `
    <section class="section">
      <div class="split" style="justify-content:space-between;align-items:center">
        <h2>${tt.owner}</h2>
        <div class="split">
          <button class="btn pri" onclick="TT.setupOpen()">시간표 설정/재설정</button>
          <button class="btn" onclick="TT.openFriend()">친구 시간표 보기</button>
        </div>
      </div>
      <div class="legend"><span class="chip">2·3학년: 선택과목 + A~G 그룹 입력 → 배치 세트(1~6) 선택</span><span class="chip">1학년: 공통 템플릿 자동 배치</span></div>
      <div id="ttGrid"></div>
      <div id="friendList" class="card" style="display:none;margin-top:12px">
        <strong>친구 시간표</strong>
        <div class="line"></div>
        <div class="split">
          <input id="friendQuery" class="btn" placeholder="친구 이름으로 검색"/>
          <button class="btn" onclick="TT.searchFriend()">검색</button>
        </div>
        <div id="friendResults" class="split tiny muted" style="margin-top:8px">검색 결과가 없습니다.</div>
        <div id="friendView" style="margin-top:10px"></div>
      </div>
    </section>`;
  TT.render();
}
const TT = {
  colorFor(subj){ const seed=Array.from(subj||'').reduce((a,c)=>a+c.charCodeAt(0),0); const hue= seed%360; return `linear-gradient(135deg,hsl(${hue} 65% 45%), hsl(${hue} 70% 55%))` },
  render(){
    const tt=Store.get('timetable'); const days=['월','화','수','목','금']; const grid=tt.grid; const rows=grid.length;
    const hoursCol = Array.from({length:rows},(_,i)=>`<div class="h">${i+1}교시</div>`).join('');
    let gridHtml='';
    for(let r=0;r<rows;r++){
      for(let c=0;c<5;c++){
        const subj=grid[r][c];
        gridHtml += `<div class="tt-cell">${ subj ? `<div class="tt-card" style="background:${this.colorFor(subj)}"><div>${subj}<small>${days[c]} · ${r+1}교시</small></div></div>` : ''}</div>`;
      }
    }
    document.getElementById('ttGrid').innerHTML = `
      <div class="tt-wrap">
        <div class="tt-hours">${hoursCol}</div>
        <div class="tt-grid">${gridHtml}</div>
      </div>`;
  },
  setupOpen(){
    const u=Auth.user(); const g=u?.grade||1;
    const modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;background:#0006;display:grid;place-items:center;z-index:90';
    modal.innerHTML = `
      <div style="width:min(720px,92vw);background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:var(--shadow)">
        <div class="split" style="align-items:center;justify-content:space-between">
          <strong>시간표 설정</strong><span class="muted tiny">학년: ${g}학년</span>
        </div>
        <div class="line"></div>
        <div id="setupArea"></div>
        <div class="split" style="justify-content:flex-end;margin-top:10px">
          <button class="btn" id="btnCancel">취소</button>
          <button class="btn pri" id="btnSave">저장</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const area=modal.querySelector('#setupArea');
    if(g==1){
      area.innerHTML = `
        <div class="muted tiny">1학년은 공통 템플릿으로 자동 배치됩니다. 필요 시 과목을 추가할 수 있어요.</div>
        <div class="line"></div>
        <div id="firstList"></div>
        <div class="split" style="margin-top:6px">
          <input id="addSub1" class="btn" placeholder="추가 과목명"/>
          <button class="btn" id="btnAdd1">과목 추가</button>
        </div>`;
      const list = Object.keys(FIRST_GRADE_TEMPLATE);
      const renderList=()=>{ modal.querySelector('#firstList').innerHTML = list.map((s,i)=>`<div class="chip" style="justify-content:space-between;gap:12px">${s}<button class="btn" onclick="this.parentElement.remove();">${'삭제'}</button></div>`).join('') || '<div class="muted tiny">공통 과목이 없습니다.</div>'; };
      renderList();
      modal.querySelector('#btnAdd1').onclick=()=>{ const v=modal.querySelector('#addSub1').value.trim(); if(!v) return; list.push(v); modal.querySelector('#addSub1').value=''; renderList(); };
      modal.querySelector('#btnSave').onclick=()=>{
        let grid=buildFirstGradeGrid();
        const extras = Array.from(modal.querySelectorAll('#firstList .chip')).map(x=>x.firstChild.textContent).filter(s=>!(s in FIRST_GRADE_TEMPLATE));
        if(extras.length){ grid = buildGridFromSelections(extras.map(e=>({subject:e, group:'G'})), grid, 0); }
        const tt=Store.get('timetable'); tt.grid=grid; tt.setup={grade:g, type:'first', subjects:extras}; Store.set('timetable',tt);
        UI.toast('시간표가 설정되었습니다'); modal.remove(); TT.render();
      };
    }else{
      // 2·3학년: 배치 세트 선택 + A~G 그룹 자동 변환
      const myGroups = (u?.subjectGroups) || {A:[],B:[],C:[],D:[],E:[],F:[],G:[]};
      area.innerHTML = `
        <div class="muted tiny">선택과목을 확인하고, 배치 세트를 선택하세요. A~G 그룹별 과목이 자동 배치됩니다.</div>
        <div class="line"></div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" id="selList">
          ${Object.entries(myGroups).map(([g,arr])=>`
            <div class="card" style="grid-column:span 1;padding:10px">
              <div><b>${g} 그룹</b></div>
              <div class="tiny muted">과목(${arr.length}):</div>
              <div class="split" style="margin-top:6px">${arr.map(s=>`<span class="chip">${CT.escape(s)}</span>`).join('')||'<span class="muted tiny">없음</span>'}</div>
            </div>`).join('')}
        </div>
        <div class="line"></div>
        <div class="split" style="align-items:center">
          <label class="chip">배치 세트:
            <select id="setIndex" class="btn">
              <option value="0">1</option><option value="1">2</option><option value="2">3</option>
              <option value="3">4</option><option value="4">5</option><option value="5">6</option>
            </select>
          </label>
        </div>`;
      modal.querySelector('#btnSave').onclick=()=>{
        const setIndex=parseInt(modal.querySelector('#setIndex').value,10)||0;
        const selections=[];
        Object.entries(myGroups).forEach(([grp,arr])=> arr.forEach(sub=> selections.push({subject:sub, group:grp})));
        const grid=buildGridFromSelections(selections, null, setIndex);
        const tt=Store.get('timetable'); tt.grid=grid; tt.setup={grade:g, type:'elective', setIndex, selections}; Store.set('timetable',tt);
        // 공유 저장
        const users=Store.get('users',[]); const me=users.find(x=>x.email===u.email);
        me.timetableShared = { grid, updated: Date.now() }; Store.set('users', users);
        UI.toast('시간표가 설정되었습니다'); modal.remove(); TT.render();
      };
    }
    modal.querySelector('#btnCancel').onclick=()=>modal.remove();
  },
  openFriend(){ document.getElementById('friendList').style.display='block'; },
  searchFriend(){
    const q=document.getElementById('friendQuery').value.trim(); const users=Store.get('users',[]); const me=Auth.user();
    const res = users.filter(u=>u.settings?.shareTimetable && u.timetableShared && u.name.includes(q) && u.email!==me.email);
    const box=document.getElementById('friendResults');
    box.className='split';
    box.innerHTML = res.length? res.map(u=>`<button class="btn" onclick="TT.showFriend('${u.email}')">${u.name} · ${u.grade}학년</button>`).join(' ') : '<span class="muted tiny">검색 결과가 없습니다.</span>';
  },
  showFriend(email){
    const u=Store.get('users',[]).find(x=>x.email===email); if(!u||!u.timetableShared){ UI.toast('해당 친구가 공유를 꺼두었거나 시간표가 없습니다'); return; }
    const grid=u.timetableShared.grid; const days=['월','화','수','목','금']; const rows=grid.length;
    let gridHtml=''; for(let r=0;r<rows;r++){ for(let c=0;c<5;c++){ const subj=grid[r][c]; gridHtml += `<div class="tt-cell">${ subj? `<div class="tt-card" style="background:${TT.colorFor(subj)}"><div>${subj}<small>${days[c]} · ${r+1}교시</small></div></div>`:''}</div>`; } }
    document.getElementById('friendView').innerHTML = `
      <div class="muted" style="margin-bottom:8px">${u.name}(${u.grade}학년)의 시간표</div>
      <div class="tt-wrap"><div class="tt-hours">${Array.from({length:rows},(_,i)=>`<div class="h">${i+1}교시</div>`).join('')}</div><div class="tt-grid">${gridHtml}</div></div>`;
  }
};

window.ViewTimetable = ViewTimetable; // [moduleized]
window.TT = TT; // [moduleized]
window.GROUP_SLOT_SETS = GROUP_SLOT_SETS; // [moduleized]
window.buildGridFromSelections = buildGridFromSelections; // [moduleized]
window.FIRST_GRADE_TEMPLATE = FIRST_GRADE_TEMPLATE; // [moduleized]
window.buildFirstGradeGrid = buildFirstGradeGrid; // [moduleized]
