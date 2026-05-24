const crypto = require('crypto');

const COOKIE_NAME = 'zw_session';

function getSecret(){
  const secret = process.env.SESSION_SECRET;
  if(!secret || secret.length < 32) throw new Error('SESSION_SECRET must be configured and at least 32 characters');
  return secret;
}

function base64url(input){
  return Buffer.from(input).toString('base64url');
}

function sign(value){
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSession(user){
  const payload = base64url(JSON.stringify({ name:user.name, role:user.role, channels:user.channels || [], iat:Date.now() }));
  return payload + '.' + sign(payload);
}

function readCookie(event){
  const header = event.headers.cookie || event.headers.Cookie || '';
  const cookies = Object.fromEntries(header.split(';').map(part=>part.trim()).filter(Boolean).map(part=>{
    const idx = part.indexOf('=');
    return idx === -1 ? [part, ''] : [part.slice(0, idx), decodeURIComponent(part.slice(idx+1))];
  }));
  return cookies[COOKIE_NAME] || '';
}

function getSession(event){
  const token = readCookie(event);
  const [payload, mac] = token.split('.');
  if(!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if(a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try{ return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }catch(e){ return null; }
}

function sessionCookie(token){
  return COOKIE_NAME + '=' + encodeURIComponent(token) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800';
}

function clearCookie(){
  return COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function json(statusCode, body, headers={}){
  return { statusCode, headers:{ 'Content-Type':'application/json', ...headers }, body:JSON.stringify(body) };
}

module.exports = { createSession, getSession, sessionCookie, clearCookie, json };
