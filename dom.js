// applyUserTheme: 원문 그대로 유지
function applyUserTheme(){
  const u = Auth.user();
  const wantDark = (u?.settings?.theme === 'dark');
  document.documentElement.classList.toggle('theme-dark', wantDark);
  // Admin gear visible?
  document.getElementById('btnAdmin').style.display = Auth.isAdmin()? 'grid':'none';
}

window.applyUserTheme = applyUserTheme; // [moduleized]
