async function requestDeepAiFeedback(pureText, taskType){
  // taskType: 'IA_PHYS' or 'EE_GENERIC'
  try {
    const resp = await fetch('http://localhost:3000/api/ib-eval', { // 너 서버 주소
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text: pureText, taskType })
    });
    const data = await resp.json();
    return data.feedback || '(서버 응답 없음)';
  } catch (e){
    return '(LLM 서버 호출에 실패했습니다.)';
  }
}
