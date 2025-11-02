/* ========= IB 자동 점검 로직 (로컬 키워드 베이스) ========= */

/*
 IBLocalChecker:
 - 파일에서 텍스트를 뽑고 (readFileAsText)
 - IA_PHYS / EE_GENERIC 타입으로 간단한 기준 점검
 - 점검 결과를 summary + details 구조로 반환
*/
const IBLocalChecker = {
  // 파일 읽기 (텍스트 기반)
  readFileAsText(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();

      reader.onload = e => {
        const raw = e.target.result || '';
        const text = (typeof raw === 'string')
          ? raw
          : new TextDecoder().decode(raw);
        resolve(text.replace(/\r/g,''));
      };

      try {
        reader.readAsText(file, 'utf-8');
      } catch(err) {
        reject(err);
      }
    });
  },

  evaluate(text, type){
    const lower = text.toLowerCase();

    if(type === 'IA_PHYS'){
      return this.evaluatePhysicsIA(lower);
    }
    if(type === 'EE_GENERIC'){
      return this.evaluateEEGeneric(lower);
    }

    return {
      summary: '알 수 없는 과제 유형입니다.',
      details: []
    };
  },

  evaluatePhysicsIA(lower){
    // Physics IA rubric 핵심 요소를 키워드로만 점검
    const checks = [
      {
        criterion: 'Exploration (탐구 설정)',
        mustHave: [
          {key:'research question', label:'Research Question(연구 질문) 명시'},
          {key:'independent variable', label:'독립변수 언급'},
          {key:'dependent variable', label:'종속변수 언급'},
          {key:'controlled variable', label:'통제변수 / control variable 언급'},
          {key:'procedure', label:'절차(Procedure) 또는 Methodology 서술'}
        ],
        commentIfMissing: '연구 질문이나 변수 정의, 실험 절차가 분명하지 않으면 Exploration 점수대가 낮아질 수 있음 (IA Physics rubric은 명확한 RQ·변수 통제·재현가능성을 요구).'
      },
      {
        criterion: 'Analysis (데이터 분석)',
        mustHave: [
          {key:'uncertaint', label:'불확실성(uncertainty) 다룸'},
          {key:'error', label:'오차(error) 또는 systematic/random error 언급'},
          {key:'graph', label:'그래프/데이터 처리 언급(graph, slope, regression 등)'},
          {key:'calculation', label:'계산 과정 또는 수식 derivation 언급'}
        ],
        commentIfMissing: '불확실성, 그래프 해석, 수식 기반 논리가 없으면 Analysis에서 높은 레벨 힘들다.'
      },
      {
        criterion: 'Evaluation (평가/한계)',
        mustHave: [
          {key:'limitation', label:'한계(limitation) 언급'},
          {key:'improvement', label:'개선(improvement) 또는 future work 언급'},
          {key:'reliability', label:'신뢰도(reliability)나 validity 언급'}
        ],
        commentIfMissing: '평가 파트가 약하면 “so what?” 결론이 된다. 루브릭은 구체적 한계+개선 제안을 요구.'
      },
      {
        criterion: 'Communication (구조/표현)',
        mustHave: [
          {key:'introduction', label:'Introduction/배경 설명'},
          {key:'conclusion', label:'Conclusion/결론 섹션'},
          {key:'table', label:'표(Table)나 정리된 데이터 언급'},
          {key:'figure', label:'그림(Figure)나 레이블 있는 시각자료 언급'}
        ],
        commentIfMissing: 'Communication은 전반 구조, 도표 라벨링, 단락 구성이 논리적으로 전달되는지 본다.'
      }
    ];

    const details = [];
    let issuesTotal = 0;

    checks.forEach(block=>{
      const missing = block.mustHave.filter(req=> !lower.includes(req.key));
      const passed  = block.mustHave.filter(req=> lower.includes(req.key));

      details.push({
        criterion: block.criterion,
        hits: passed.map(p=>p.label),
        misses: missing.map(m=>m.label),
        note: (missing.length>0
          ? block.commentIfMissing
          : '주요 요소가 전반적으로 언급되어 있음')
      });

      issuesTotal += missing.length;
    });

    const summaryLines = [];
    summaryLines.push(`Physics IA 자동 점검(로컬):`);
    summaryLines.push(`- 탐구 설정 / 분석 / 평가 / 전달(Communication) 4가지 축 기준으로 키워드 존재 여부만 확인.`);
    summaryLines.push(`- 누락된 키워드는 그 Criterion 점수에서 감점 위험 포인트.`);
    summaryLines.push(`→ 총 누락 항목: ${issuesTotal}개`);

    return {
      summary: summaryLines.join('\n'),
      details
    };
  },

  evaluateEEGeneric(lower){
    // Extended Essay 공통 포인트 키워드 점검
    const checks = [
      {
        criterion: 'Research Focus',
        mustHave: [
          {key:'research question', label:'Research Question(연구 질문)'},
          {key:'aim of this essay', label:'목적/aim 언급'},
          {key:'scope', label:'범위(scope / limitation of scope) 언급'}
        ],
        commentIfMissing: 'EE는 RQ와 범위 설정이 명확해야 “focused research”로 인정.'
      },
      {
        criterion: 'Research / Sources',
        mustHave: [
          {key:'source', label:'source / primary source / secondary source 언급'},
          {key:'citation', label:'citation / referenced / bibliography 언급'},
          {key:'appendix', label:'appendix / appendices 언급'}
        ],
        commentIfMissing: '근거(데이터/인용/출처)를 추적 가능하게 제시해야 Academic Integrity와 Research quality 충족.'
      },
      {
        criterion: 'Analysis / Discussion',
        mustHave: [
          {key:'analysis', label:'analysis / analyze 언급'},
          {key:'discussion', label:'discussion / discuss 언급'},
          {key:'evaluate', label:'evaluate / evaluation 언급'}
        ],
        commentIfMissing: '단순 요약이 아니라 비판적 분석/평가가 있어야 중상 이상 점수.'
      },
      {
        criterion: 'Conclusion',
        mustHave: [
          {key:'conclusion', label:'conclusion 언급'},
          {key:'answer to the research question', label:'research question에 대한 직접적 답변 표현'},
          {key:'further research', label:'further research / future research 언급'}
        ],
        commentIfMissing: '결론은 RQ에 직접 답하고, 한계와 후속 연구 방향을 제시해야 한다.'
      }
    ];

    const details = [];
    let issuesTotal = 0;

    checks.forEach(block=>{
      const missing = block.mustHave.filter(req=> !lower.includes(req.key));
      const passed  = block.mustHave.filter(req=> lower.includes(req.key));

      details.push({
        criterion: block.criterion,
        hits: passed.map(p=>p.label),
        misses: missing.map(m=>m.label),
        note: (missing.length>0
          ? block.commentIfMissing
          : '핵심 구조 요소는 대체로 나타난다.')
      });

      issuesTotal += missing.length;
    });

    const summaryLines = [];
    summaryLines.push(`Extended Essay 자동 점검(로컬):`);
    summaryLines.push(`- RQ 명시, 출처/근거, 분석/토론, 결론에서의 직접 답변 여부만 키워드로 확인.`);
    summaryLines.push(`- 누락된 파트는 집중도/비판성/학술적 정직성에서 감점 위험.`);
    summaryLines.push(`→ 총 누락 항목: ${issuesTotal}개`);

    return {
      summary: summaryLines.join('\n'),
      details
    };
  },

  prettyDetail(report){
    return report.details.map(block=>{
      return (
        `[${block.criterion}]\n`
        + `포착된 요소: ${block.hits.length? block.hits.join(', ') : '없음'}\n`
        + `부족/누락: ${block.misses.length? block.misses.join(', ') : '없음'}\n`
        + `메모: ${block.note}\n`
      );
    }).join('\n');
  }
};

/*
 IBCheckUI:
 - DOM에서 업로드 버튼, 타입 셀렉트, 결과 DIV를 잡고
 - 실행 버튼 누르면 IBLocalChecker.evaluate() 결과를 예쁘게 뿌림
*/
const IBCheckUI = {
  async runCheck(){
    const typeSel = document.getElementById('ibType');
    const fileInp = document.getElementById('ibFile');
    const outBox  = document.getElementById('ibResult');

    if(!typeSel || !fileInp || !outBox){
      console.warn('IBCheckUI: 필수 요소 없음');
      return;
    }

    const type = typeSel.value;
    const file = fileInp.files && fileInp.files[0];
    if(!file){
      outBox.textContent = '파일이 선택되지 않았습니다.';
      return;
    }

    outBox.textContent = '분석 중...';

    try{
      // 1) 파일에서 텍스트 추출
      const text = await IBLocalChecker.readFileAsText(file);

      // 2) 평가
      const report = IBLocalChecker.evaluate(text, type);

      // 3) 출력 문자열 구성
      const pretty =
        '=== 요약 ===\n'
        + report.summary
        + '\n\n=== 상세 ===\n'
        + IBLocalChecker.prettyDetail(report);

      // UI에 표시
      outBox.textContent = pretty;
    }catch(err){
      outBox.textContent = '분석 도중 에러가 발생했습니다: ' + (err.message || err);
    }
  }
};

/* ========= Study Apps (기존 + IB 블록 포함) ========= */

function svgDataUri(title,a='#0e2148',b='#122a54'){
  const t=String(title||'APP').slice(0,10);
  const svg=`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>
  </linearGradient></defs>
  <rect width="640" height="360" rx="16" fill="url(#g)"/>
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="48" font-family="Segoe UI, Arial, sans-serif">${t.replace(/&/g,'&amp;')}</text>
</svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

function ViewStudy(){
  // 1) 기존 추천 앱들 로컬 저장
  const rec = [
    {name:'Desmos Graphing Calculator', desc:'함수 그래프/미적분 시각화', url:'https://www.desmos.com/calculator', thumb:svgDataUri('Desmos') , similar:['GeoGebra','Wolfram Alpha'], tip:'좌표축 범위를 수식으로 고정하고 슬라이더로 매개변수 탐색.'},
    {name:'Anki', desc:'스페이스드 리핏(암기 카드)', url:'https://apps.ankiweb.net/', thumb:svgDataUri('Anki','#173b2a','#0f6c3f'), similar:['Quizlet','Remnote'], tip:'카드에 “최소한의 정보” 원칙 적용 → 회상 난이도↓, 유지율↑.'},
    {name:'Forest', desc:'포모도로 집중 타이머', url:'https://www.forestapp.cc/', thumb:svgDataUri('Forest','#203a1a','#2a5a1f'), similar:['Focus To-Do','Study Bunny'], tip:'친구와 공동세션으로 책임감 상승. 공부·휴식 비율 50:10 추천.'},
    {name:'Notion', desc:'노트/DB/과제 관리', url:'https://www.notion.so/', thumb:svgDataUri('Notion','#1b1b1b','#333333'), similar:['Obsidian','Evernote'], tip:'과제DB + 칸반 보드 + 템플릿 버튼으로 주차별 루틴 자동화.'},
    {name:'GeoGebra', desc:'대수/기하 도구 모음', url:'https://www.geogebra.org/', thumb:svgDataUri('GeoGebra','#0f2b63','#1c4ca3'), similar:['Desmos','Wolfram Alpha'], tip:'벡터/행렬 연산의 단계별 시각화로 증명 직관 얻기.'},
    {name:'Wolfram Alpha', desc:'계산 지식 엔진', url:'https://www.wolframalpha.com/', thumb:svgDataUri('Wolfram','#682300','#a33d00'), similar:['Symbolab','Mathway'], tip:'쿼리는 “자연어+수식” 혼합이 좋음. 예: “limit sin x / x as x->0”.'},
    {name:'Symbolab', desc:'해설 포함 수학 풀이', url:'https://www.symbolab.com/', thumb:svgDataUri('Symbolab','#11202f','#1d3b5a'), similar:['Mathway','Wolfram Alpha'], tip:'풀이 단계 비교(여러 해법)로 약점 유형 파악.'},
    {name:'Pomofocus', desc:'웹 포모도로 타이머', url:'https://pomofocus.io/', thumb:svgDataUri('Pomofocus','#4a0d0d','#7a1919'), similar:['Forest','Marinara Timer'], tip:'하루 10세션 목표, 주간 성과 그래프 확인 → 습관 고착.'}
  ];
  Store.set('studyapps', rec);

  const apps=Store.get('studyapps',[]);

  // 2) HTML 렌더 (기존 + IB 카드 추가)
  Router.mount.innerHTML = `
    <section class="section">
      <h2>학업 도움 앱 & 사이트</h2>

      <div class="app-grid" id="appGrid">
        ${apps.map((a,i)=>`
          <div class="app-card">
            <img class="thumb" src="${a.thumb}" alt="${a.name}"/>
            <div style="font-weight:800">${a.name}</div>
            <div class="muted tiny">${a.desc}</div>
            <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
              <span class="chip">바로가기</span>
              <button class="btn pri" onclick="Apps.open(${i})">➡️</button>
            </div>
          </div>`).join('')}
      </div>

      <div id="appDetail"></div>

      <div class="card" style="margin-top:16px">
        <strong>IB 과제 자체 점검 (오프라인 키워드 검사)</strong>
        <div class="tiny muted" style="margin-top:4px">
          IA / EE 문서를 올리면 IB 루브릭 핵심 요소(탐구 질, 근거, 분석, 결론 등)를 기준으로 누락된 부분을 알려줍니다.
          이건 로컬에서 텍스트의 키워드만 확인하는 수준이라 실제 공식 채점 결과랑 1:1 동일하지는 않고,
          어떤 파트(예: RQ 명확성, 불확실성 분석, 한계 제시 등)가 약한지 방향을 빠르게 잡는 용도입니다.
        </div>

        <div class="line"></div>

        <div class="split" style="gap:8px;flex-wrap:wrap">
          <label class="chip">
            유형
            <select id="ibType" class="btn" style="margin-left:6px">
              <option value="IA_PHYS">Physics IA (물리 IA)</option>
              <option value="EE_GENERIC">Extended Essay (일반형)</option>
            </select>
          </label>

          <label class="chip" style="flex:1;min-width:200px">
            <input id="ibFile" type="file" style="border:0;background:transparent;color:var(--ink);padding:0;width:100%" />
          </label>

          <button class="btn pri" onclick="IBCheckUI.runCheck()">분석 실행</button>
        </div>

        <div class="line"></div>

        <div class="tiny muted">분석 결과</div>
        <pre id="ibResult" style="white-space:pre-wrap;font-size:12px;line-height:1.5;color:var(--ink);background:var(--chip);border:1px solid var(--line);border-radius:12px;padding:12px;max-height:320px;overflow:auto;">
(아직 없음)
        </pre>
      </div>
    </section>`;
}

const Apps = {
  open(i){
    const a=(Store.get('studyapps',[])[i]);
    if(!a) return;
    const det=document.getElementById('appDetail');
    det.innerHTML = `
      <div class="app-detail">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${a.name}</strong>
            <div class="muted tiny" style="margin-top:4px">${a.desc}</div>
          </div>
          <a class="btn pri" href="${a.url}" target="_blank" rel="noopener">사이트 열기</a>
        </div>

        <div class="line"></div>

        <div class="muted">유사한 추천 앱</div>
        <div class="split" style="margin-top:8px">
          ${(a.similar||[]).map(s=>`<span class="chip">${s}</span>`).join('') || '<span class="muted tiny">없음</span>'}
        </div>

        ${a.tip
          ? `<div class="line"></div><div class="tiny muted">활용 팁</div>
             <div style="margin-top:6px">${CT.escape(a.tip)}</div>`
          : ''
        }
      </div>`;
  }
};

/* ========= 전역으로 노출 ========= */
window.ViewStudy = ViewStudy;
window.Apps = Apps;
window.svgDataUri = svgDataUri;
window.IBLocalChecker = IBLocalChecker;
window.IBCheckUI = IBCheckUI;
