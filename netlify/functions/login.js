const { createSession, sessionCookie, json } = require('./lib/session');
const { hashPin, safeUser, loadUsers } = require('./lib/auth');

exports.handler = async function(event){
  if(event.httpMethod !== 'POST') return json(405, { error:'Method not allowed' });
  let body;
  try{ body = JSON.parse(event.body || '{}'); }catch(e){ return json(400, { error:'Invalid request body' }); }
  const name = String(body.name || '').trim();
  const pin = String(body.pin || '').trim();
  if(!name || !pin) return json(400, { error:'Please enter your name and PIN.' });
  const pinHash = hashPin(pin);
  const user = loadUsers().find(u => u.name.toLowerCase() === name.toLowerCase() && u.pin_hash === pinHash);
  if(!user) return json(401, { error:'Incorrect name or PIN.' });
  const safe = safeUser(user);
  return json(200, { user:safe }, { 'Set-Cookie':sessionCookie(createSession(safe)) });
};
