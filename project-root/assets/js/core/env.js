/* ========= Crypto / Security ========= */
async function sha256Hex(txt){ const enc=new TextEncoder().encode(txt); const buf=await crypto.subtle.digest('SHA-256', enc); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('') }
const PEPPER = 'p0rtal#pep';
async function pwHashFor(email, pw){ return sha256Hex(`${email}:${pw}:${PEPPER}`) }

// Expose for others
window.sha256Hex = sha256Hex;  // [moduleized]
window.PEPPER = PEPPER;        // [moduleized]
window.pwHashFor = pwHashFor;  // [moduleized]
