// Deep-link to signup (원문 최상단 IIFE)
(function(){
  try{
    if (location.hash === '#signup') {
      const el = document.getElementById('goSignup') || document.getElementById('goSignup2');
      if (el && typeof el.click === 'function') el.click();
    }
  }catch(e){}
})();

/* ========= First-run seeds ========= */
(function initEmpty(){
  const keys = ['todos','notices','calendar','library','meals','timetable','friends','news','notifs'];
  keys.forEach(k=>{
    if(Store.get(k)===undefined){
      if(k==='timetable') Store.set(k,{owner:'나의 시간표', grid:[...Array(8)].map(()=>Array(5).fill('')), setup:null});
      else if(k==='meals') Store.set(k,{});
      else if(k==='notifs') Store.set(k,{personal:[], global:[]});
      else Store.set(k, []);
    }
  });
  // Users/session
  if(!Store.get('users')){
    const adminEmail='admin@pyoseon.hs.kr';
    const adminHash='5ce3a72eaf1436496b626bed99dc6d8cbfabf0404300f5ed250b60585b12de6a'; // salted(admin@..:admin1234:p0rtal#pep)
    Store.set('users', [
      { email:adminEmail, name:'관리자', pwHash:adminHash, role:'admin', grade:3, classNo:1, studentNo:1,
        settings:{theme:'light', pushPersonal:true, pushGlobal:true, shareTimetable:true},
        timetableShared:null,
        subjectGroups:{A:['수학','영어','국어'],B:['체육','음악','미술'],C:['물리학Ⅰ','화학Ⅰ','생명과학Ⅰ'],D:['지구과학Ⅰ','사회문화','경제'],E:['세계사','동아시아사','한국지리'],F:['정보','기술·가정','진로활동'],G:['일본어Ⅰ','중국어Ⅰ','한문Ⅰ']}
      }
    ]);
  }
  if(!Store.get('session')) Store.set('session', { email:null, auto:false });

  // 뉴스 예시
  if((Store.get('news',[])||[]).length===0){
    const demo = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      section: '캠퍼스',
      title: '학생회, 가을 축제 준비위원회 출범',
      lead: '학생 참여 중심의 축제를 위해 본격 시동을 걸었습니다.',
      thumb: '',
      body: '올해 가을 축제 준비위원회가 공식 출범했습니다.\n학생회는 이번 주부터 부스 신청을 받고, 안전/청결 지침을 사전에 공지할 예정입니다.\n세부 일정과 라인업은 9월 초 공개됩니다.',
      authorEmail: 'admin@pyoseon.hs.kr',
      authorName: '관리자',
      date: fmtDate(now()),
      ts: Date.now()
    };
    Store.set('news',[demo]);
  }
})();

/* === Safety patch: ensure built-in admin exists (non-destructive) === */
;(async function repairAdminAccount(){
  try{
    const adminEmail = 'admin@pyoseon.hs.kr';
    let users = Store.get('users', []);
    if (!Array.isArray(users)) users = [];
    const exists = users.some(u => u && u.email === adminEmail);
    if (!exists) {
      const adminPwHash = await pwHashFor(adminEmail, 'admin1234');
      users.push({
        email: adminEmail,
        name: '관리자',
        pwHash: adminPwHash,
        role: 'admin',
        grade: 3, classNo: 1, studentNo: 1,
        settings: { theme: 'light', pushPersonal: true, pushGlobal: true, shareTimetable: true },
        timetableShared: null,
        subjectGroups: { A: ['수학','영어','국어'], B: ['체육','음악','미술'], C: ['물리학','화학','생명과학'], D: ['역사','윤리','사회'], E: ['동아시아사','한국지리'], F: ['정보','기술·가정','진로활동'], G: ['일본어Ⅰ','중국어Ⅰ','한문Ⅰ'] }
      });
      Store.set('users', users);
      console.info('[repair] admin user was missing and has been restored.');
    }
  }catch(e){ console.warn('[repair] admin check failed', e); }
})();
