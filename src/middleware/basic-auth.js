const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
  const authToken = req.get('authorization') || '';

  let basicToken;
  if (!authToken.toLowerCase().startsWith('basic')) {
    return res.status(401).json({error: 'Missing basic token'});
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUserName, tokenPw] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');

  if (!tokenUserName || !tokenPw) {
    return res.status(401).json({error: 'Unauthorized request'});
  }

  req.app.get('db')('thingful_users')
    .where({user_name: tokenUserName})
    .first()
    .then(user => {
      if (!user) {
        return res.status(401).json({error: 'Unauthorized request'});
      }

      return AuthService.comparePasswords(tokenPw, user.password)
        .then(passwordsMatch => {
          if (!passwordsMatch) {
            return res.status(401).json({error: 'Unauthorized request'});
          }

          req.user = user;
          next();
        });
    })
    .catch(next);

}

module.exports = { requireAuth };