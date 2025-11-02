/* ========= Search ========= */
function doSearch(q){
  const inText=(s)=> (s||'').toLowerCase().includes(q.toLowerCase());
  const notices=Store.get('notices',[]).filter(n=>inText(n.title));
  const news=Store.get('news',[]).filter(n=>inText(n.title)||inText(n.body)||inText(n.lead)||inText(n.section));
  const posts=(CT.get()?.posts||[]).filter(p=>inText(p.title)||inText(p.body)||inText(p.authorName));
  const library=Store.get('library',[]).filter(l=>inText(l.title));
  const res=[...notices.map(n=>`[공지] ${n.title}`), ...news.map(n=>`[뉴스] ${n.title}`), ...posts.map(p=>`[게시글] ${p.title? p.title+' — ' : ''}${(p.body||'').slice(0,24)}…`), ...library.map(l=>`[도서관] ${l.title}`)];
  document.getElementById('searchResult').innerHTML = res.length? res.map(r=>`<div>${CT.escape(r)}</div>`).join('') : '<span class="muted">검색 결과가 없습니다.</span>';
}

window.doSearch = doSearch; // [moduleized]
