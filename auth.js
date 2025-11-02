const LoginGuard = {
  key:'login_guard',
  get(){ return Store.get(this.key,{}) },
  set(v){ Store.set(this.key,v) },
  canTry(email){
    const g=this.get()[email]||{fails:0,lockUntil:0};
    if(Date.now()<g.lockUntil) return {ok:false, wait:g.lockUntil-Date.now()};
    return {ok:true}
  },
  fail(email){
    const map=this.get(); const g=map[email]||{fails:0,lockUntil:0};
    g.fails++; if(g.fails>=5){ g.lockUntil=Date.now()+5*60*1000; g.fails=0; }
    map[email]=g; this.set(map);
  },
  success(email){ const map=this.get(); delete map[email]; this.set(map); }
};

const Auth = {
  user(){ const s=Store.get('session',{email:null}); if(!s.email) return null; return (Store.get('users',[]).find(u=>u.email===s.email) || null) },
  role(){ return this.user()?.role || 'user' },
  isAdmin(){ return this.role()==='admin' },
  async login(email, pw, auto){
    const can=LoginGuard.canTry(email); if(!can.ok) throw new Error(`보안 대기중: ${Math.ceil(can.wait/1000)}초 후 재시도`);
    const users=Store.get('users',[]); const u=users.find(x=>x.email===email);
    if(!u){ LoginGuard.fail(email); throw new Error('존재하지 않는 계정입니다.'); }
    const salted=await pwHashFor(email,pw);
    const legacy=await sha256Hex(pw);
    if(u.pwHash!==salted && u.pwHash!==legacy){ LoginGuard.fail(email); throw new Error('비밀번호가 올바르지 않습니다.'); }
    LoginGuard.success(email);
    Store.set('session',{email, auto:!!auto}); if(auto) localStorage.setItem('autoLogin','1'); else localStorage.removeItem('autoLogin');
  },
  async signup({grade,name,email,cls,no,pw,pw2,groups}){
    if(!grade) throw new Error('학년을 선택하세요.');
    if(!name) throw new Error('이름을 입력하세요.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('이메일 형식이 올바르지 않습니다.');
    if(!cls || !no) throw new Error('반/번호를 입력하세요.');
    if(pw.length<8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
    if(pw!==pw2) throw new Error('비밀번호 확인이 일치하지 않습니다.');
    const users=Store.get('users',[]); if(users.some(u=>u.email===email)) throw new Error('이미 등록된 이메일입니다.');
    const pwHash=await pwHashFor(email,pw);
    const role = (email==='admin@pyoseon.hs.kr')?'admin':'user';
    users.push({email, name, pwHash, role, grade:parseInt(grade,10), classNo:parseInt(cls,10), studentNo:parseInt(no,10),
                settings:{theme:'light', pushPersonal:true, pushGlobal:true, shareTimetable:false},
                timetableShared:null,
                subjectGroups:groups});
    Store.set('users', users); Store.set('session', {email, auto:true}); localStorage.setItem('autoLogin','1');
  },
  logout(){ Store.set('session',{email:null, auto:false}); localStorage.removeItem('autoLogin'); }
};

// Expose
window.LoginGuard = LoginGuard; // [moduleized]
window.Auth = Auth;             // [moduleized]
