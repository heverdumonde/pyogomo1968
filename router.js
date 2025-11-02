const Router = {
  mount: document.getElementById('view'),
  tabs: [...document.querySelectorAll('nav.bottom a')],
  render(){
    let hash = location.hash.replace('#','') || 'home';
    if(hash.startsWith('news-')) hash = 'news';
    this.tabs.forEach(a=>a.classList.toggle('active', a.dataset.tab===hash));
    const views = { home: ViewHome, timetable: ViewTimetable, news: ViewNews, community: ViewCommunity, study: ViewStudy, me: ViewMe };
    (views[hash]||ViewHome)();
  }
};

window.Router = Router; // [moduleized]
