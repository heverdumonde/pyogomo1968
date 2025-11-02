// Core (순서 중요)
import './core/store.js';      // [moduleized]
import './core/env.js';        // [moduleized]

// 초기 시드/패치 (Store, env 이후 실행)
import './bootstrap/seed.js';  // [moduleized]

// Auth/Router/UI
import './core/auth.js';       // [moduleized]
import './ui/components.js';   // [moduleized]
import './core/router.js';     // [moduleized]
import './core/dom.js';        // [moduleized]

// Features
import './features/home.js';         // [moduleized]
import './features/timetable.js';    // [moduleized]
import './features/news.js';         // [moduleized]
import './features/community.js';    // [moduleized]
import './features/study.js';        // [moduleized]
import './features/me.js';           // [moduleized]
import './features/notification.js'; // [moduleized]
import './features/search.js';       // [moduleized]
import './features/ibcheck.js';      // [moduleized]
// Startup (이벤트 바인딩/초기 렌더/자동로그인 등)
import './bootstrap/startup.js';     // [moduleized]
