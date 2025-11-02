/* ========= Home ========= */
function ViewHome(){
  Router.mount.innerHTML = `
    <section class="section">
      <h2>홈</h2>
      <div class="cards">
        <div class="card half">
          <div class="split" style="align-items:center;justify-content:space-between">
            <div><strong>등급 계산기</strong><div class="muted tiny">학년 기준: 1학년=5등급제, 2·3학년=9등급제</div></div>
            <div class="split">
              <input id="popTotal" type="number" min="1" placeholder="전체 인원(명수)" class="btn"/>
              <button class="btn pri" onclick="GradeCalc.calc()">계산</button>
            </div>
          </div>
          <div id="gradeInfo" class="tiny muted" style="margin-top:6px"></div>
          <div class="line"></div>
          <div id="gradeTable" class="muted tiny">전체 인원을 입력해 보세요.</div>
        </div>

        <!-- === 오늘의 할 일 (신규 UI) === -->
        <div class="card half">
          <div class="split" style="align-items:center;justify-content:space-between">
            <div class="todo-summary">
              <strong>오늘의 할 일</strong>
              <span class="chip" id="todoSummary">0/0 완료</span>
            </div>
            <div class="split">
              <button class="btn" onclick="Todo.clearDone()">완료 정리</button>
              <button class="btn" onclick="Todo.clearAll()">전체 삭제</button>
            </div>
          </div>
          <div class="todo-card">
            <div class="todo-input-row">
              <input id="todoInput" placeholder="할 일을 입력하고 Enter" onkeydown="if(event.key==='Enter') Todo.add()" />
              <button class="btn pri" onclick="Todo.add()">추가</button>
            </div>
            <div id="todoList" class="todo-list"></div>
          </div>
        </div>

        <div class="card third">
          <strong>학교 공지</strong>
          <ul class="list" id="noticeList"><li class="muted" style="width:100%">등록된 공지가 없습니다.</li></ul>
        </div>

        <div class="card third">
          <strong>학사 일정</strong>
          <ul class="list" id="calList"><li class="muted" style="width:100%">등록된 일정이 없습니다.</li></ul>
        </div>

        <div class="card third">
          <strong>도서관</strong>
          <ul class="list" id="libList"><li class="muted" style="width:100%">등록된 소식이 없습니다.</li></ul>
        </div>

        <div class="card">
          <div class="split" style="align-items:center;justify-content:space-between">
            <div><strong>급식표</strong></div>
            <div class="split">
              <button class="btn" onclick="Meal.prevMonth()">이전</button>
              <button class="btn" onclick="Meal.nextMonth()">다음</button>
            </div>
          </div>
          <div id="mealCalendar"></div>
          <div id="mealDetail" class="meal-detail" style="display:none"></div>
        </div>
      </div>
    </section>`;
  GradeCalc.renderInfo(); Todo.render(); Meal.render();
}
const GradeCalc = {
  dist5:[20,20,20,20,20],
  dist9:[4,7,12,17,20,17,12,7,4],
  renderInfo(){ const u=Auth.user(); const g=u?.grade||1; const tag=(g==1)?'5등급':'9등급'; document.getElementById('gradeInfo').innerHTML=`현재 프로필 학년: <b>${g}학년</b> → <b>${tag}</b> 기준`; },
  calc(){
    const total=parseInt(document.getElementById('popTotal').value,10)||0; const u=Auth.user(); const g=u?.grade||1;
    if(total<=0){ UI.toast('전체 인원을 입력하세요'); return; }
    const dist=(g==1)?this.dist5:this.dist9;
    let remain=total;
    const rows = dist.map((pct,i)=>{
      const cnt = Math.round(total*pct/100);
      remain -= cnt;
      return {label:`${i+1}등급`, pct, cnt};
    });
    if(remain!==0){ rows[rows.length-1].cnt += remain; }
    const html = `
      <div class="tiny muted">총원 ${total}명 기준</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">
        ${rows.map(r=>`<div class="chip" style="justify-content:space-between"><span>${r.label}</span><span>${r.pct}% · ${r.cnt}명</span></div>`).join('')}
      </div>`;
    document.getElementById('gradeTable').innerHTML = html;
  }
};
const Todo = {
  key:'todos',
  render(){ const wrap=document.getElementById('todoList'); const todos=Store.get(this.key,[]); const done=todos.filter(t=>t.done).length;
    document.getElementById('todoSummary').textContent=`${done}/${todos.length} 완료`;
    wrap.innerHTML = (todos.length? todos.map(t=>`
      <div class="todo-item ${t.done?'done':''}" data-id="${t.id}">
        <div class="check-anim ${t.done?'checked':''}" onclick="Todo.toggle(${t.id})">${t.done?'✓':''}</div>
        <div class="t-text">${this.escape(t.text)}</div>
        <button class="del" title="삭제" onclick="Todo.remove(${t.id})">🗑</button>
      </div>`).join('') : `<div class="muted">할 일을 추가해 보세요.</div>`);
  },
  escape(s){return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))},
  add(){ const inp=document.getElementById('todoInput'); const text=inp.value.trim(); if(!text) return;
    const todos=Store.get(this.key,[]); const id=(todos.at(-1)?.id||0)+1; todos.push({id,text,done:false}); Store.set(this.key,todos); inp.value=''; this.render();
  },
  toggle(id){ const todos=Store.get(this.key,[]).map(t=>t.id===id?({...t,done:!t.done}):t); Store.set(this.key,todos); this.render(); },
  remove(id){ const todos=Store.get(this.key,[]).filter(t=>t.id!==id); Store.set(this.key,todos); this.render(); },
  clearDone(){ const todos=Store.get(this.key,[]).filter(t=>!t.done); Store.set(this.key,todos); this.render(); },
  clearAll(){ Store.set(this.key,[]); this.render(); }
};
const Meal = {
  cursor: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  render(){
    const y=this.cursor.getFullYear(), m=this.cursor.getMonth(), first=new Date(y,m,1), last=new Date(y,m+1,0);
    const head=['일','월','화','수','목','금','토'].map(d=>`<div>${d}</div>`).join(''); let days=''; const offset=first.getDay();
    for(let i=0;i<offset;i++) days+=`<div></div>`;
    for(let d=1; d<=last.getDate(); d++){
      const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const has=Store.get('meals',{})[dateStr];
      days+=`<div class="cal-day" onclick="Meal.open('${dateStr}')"><div class="num">${d}</div><div class="dots">${has?'<span class="dot"></span><span class="dot"></span>':''}</div></div>`;
    }
    document.getElementById('mealCalendar').innerHTML = `
      <div class="cal-header">
        <div></div>
        <div style="text-align:center;font-weight:800">${y}.${String(m+1).padStart(2,'0')}</div>
        <div style="text-align:right"><button onclick="Meal.prevMonth()">&lt;</button><button onclick="Meal.nextMonth()">&gt;</button></div>
      </div>
      <div class="cal-head">${head}</div><div class="calendar">${days}</div>`;
  },
  open(dateStr){ const data=Store.get('meals',{})[dateStr]; const box=document.getElementById('mealDetail');
    if(!data){ box.style.display='block'; box.innerHTML='<div class="muted">등록된 급식 정보가 없습니다.</div>'; return; }
    box.style.display='block';
    box.innerHTML = `<strong>${dateStr} 급식</strong>
      <div class="split" style="margin-top:6px;gap:18px">
        <div><div class="chip">중식</div><div class="muted">${data.lunch.join(' · ')}</div></div>
        <div><div class="chip">석식</div><div class="muted">${data.dinner.join(' · ')}</div></div>
      </div>`;
  },
  prevMonth(){ this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth()-1, 1); this.render(); },
  nextMonth(){ this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth()+1, 1); this.render(); }
};

window.ViewHome = ViewHome; // [moduleized]
window.GradeCalc = GradeCalc; // [moduleized]
window.Todo = Todo; // [moduleized]
window.Meal = Meal; // [moduleized]
