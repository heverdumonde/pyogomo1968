/* ========= My Page (설정) ========= */
function ViewMe(){
  const u=Auth.user(); if(!u){ location.hash='#home'; return showApp(false); }
  Router.mount.innerHTML = `
    <section class="section">
      <h2>설정</h2>
      <div class="cards">
        <div class="card half">
          <strong>프로필</strong><div class="line"></div>
          <div class="tiny muted" style="margin-bottom:6px">계정 / 학교 정보</div>
          <div class="split">
            <div class="chip">이름: ${CT.escape(u.name)}</div>
            <div class="chip">이메일: ${CT.escape(u.email)}</div>
            <div class="chip">학년: ${u.grade||'-'}</div>
            <div class="chip">반: ${u.classNo||'-'}</div>
            <div class="chip">번호: ${u.studentNo||'-'}</div>
            <div class="chip">역할: ${Auth.isAdmin()?'관리자':'일반'}</div>
          </div>
          <div class="line"></div>
          <button class="btn" onclick="(Auth.logout(), UI.toast('로그아웃 완료'), location.reload())">로그아웃</button>
        </div>

        <div class="card half">
          <strong>개인화</strong><div class="line"></div>
          <div class="split">
            <label class="chip"><input type="checkbox" id="setTheme" ${u.settings?.theme==='dark'?'checked':''} onchange="Settings.toggleTheme(this.checked)"> 다크 테마</label>
            <label class="chip"><input type="checkbox" id="setPNoti" ${u.settings?.pushPersonal!==false?'checked':''} onchange="Settings.toggle('pushPersonal',this.checked)"> 개인 알림</label>
            <label class="chip"><input type="checkbox" id="setGNoti" ${u.settings?.pushGlobal!==false?'checked':''} onchange="Settings.toggle('pushGlobal',this.checked)"> 전체 알림</label>
            <label class="chip"><input type="checkbox" id="setShareTT" ${u.settings?.shareTimetable?'checked':''} onchange="Settings.toggle('shareTimetable',this.checked)"> 시간표 공유</label>
          </div>
        </div>

        <div class="card half">
          <strong>보안</strong><div class="line"></div>
          <div class="tiny muted">비밀번호 변경(로컬 데모): 변경 즉시 저장</div>
          <div class="split" style="margin-top:6px">
            <input id="pwNew" type="password" placeholder="새 비밀번호(8자 이상)" class="btn" style="flex:1"/>
            <button class="btn pri" onclick="Settings.changePw()">변경</button>
          </div>
        </div>

        <div class="card half">
          <strong>데이터 관리</strong><div class="line"></div>
          <div class="split">
            <button class="btn" onclick="localStorage.clear(); UI.toast('로컬 데이터 초기화'); location.reload()">로컬 초기화</button>
          </div>
        </div>
      </div>
    </section>`;
}
const Settings = {
  saveUser(u){ const users=Store.get('users',[]).map(x=>x.email===u.email?u:x); Store.set('users',users); },
  toggleTheme(dark){ const u=Auth.user(); u.settings=u.settings||{}; u.settings.theme= dark?'dark':'light'; this.saveUser(u); applyUserTheme(); UI.toast('테마 저장'); },
  toggle(key,val){ const u=Auth.user(); u.settings=u.settings||{}; u.settings[key]=val; this.saveUser(u); UI.toast('저장됨'); },
  async changePw(){ const u=Auth.user(); const pw=document.getElementById('pwNew').value; if((pw||'').length<8){ UI.toast('8자 이상 입력'); return; } u.pwHash=await pwHashFor(u.email,pw); this.saveUser(u); UI.toast('비밀번호 변경 완료'); document.getElementById('pwNew').value=''; }
};

window.ViewMe = ViewMe;       // [moduleized]
window.Settings = Settings;   // [moduleized]
