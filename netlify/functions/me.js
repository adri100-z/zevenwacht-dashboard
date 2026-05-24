const { getSession, json } = require('./lib/session');
const { safeUser, findUserBySession } = require('./lib/auth');

exports.handler = async function(event){
  const user = findUserBySession(getSession(event));
  if(!user) return json(401, { error:'Not authenticated' });
  return json(200, { user:safeUser(user) });
};
