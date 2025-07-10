const { Keyv } = require('keyv');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const RedisStore = require('connect-redis').default;
const {
  setupOpenId,
  googleLogin,
  githubLogin,
  discordLogin,
  facebookLogin,
  appleLogin,
  setupSaml,
  openIdJwtLogin,
} = require('~/strategies');
const { isEnabled } = require('~/server/utils');
const keyvRedis = require('~/cache/keyvRedis');
const { logger } = require('~/config');
/**
 * 이 코드는 Node.js + Express 애플리케이션에서 OAuth/OpenID/SAML 기반 소셜 로그인 기능을 설정하는 함수입니다.
 * 다양한 인증 제공자(Google, GitHub, Discord 등)를 지원하고, OpenID와 SAML 방식의 싱글 사인온(SSO)도 포함됩니다.
 */
/**
 * 이 함수는 Express 앱 인스턴스를 받아:
 * 활성화된 소셜 로그인 전략들을 passport에 등록하고,
 * 필요한 세션 저장소(Redis 또는 MemoryStore)를 설정하고,
 * OpenID 또는 SAML 설정까지 수행합니다.
 * 
 * @param {Express.Application} app
 */
const configureSocialLogins = async (app) => {
  logger.info('Configuring social logins...');

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(googleLogin());
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    passport.use(facebookLogin());
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(githubLogin());
  }
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(discordLogin());
  }
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY_PATH) {
    passport.use(appleLogin());
  }
  if (
    process.env.OPENID_CLIENT_ID &&
    process.env.OPENID_CLIENT_SECRET &&
    process.env.OPENID_ISSUER &&
    process.env.OPENID_SCOPE &&
    process.env.OPENID_SESSION_SECRET
  ) {
    logger.info('Configuring OpenID Connect...');
    const sessionOptions = {
      secret: process.env.OPENID_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    };
    if (isEnabled(process.env.USE_REDIS)) {
      logger.debug('Using Redis for session storage in OpenID...');
      const keyv = new Keyv({ store: keyvRedis });
      const client = keyv.opts.store.client;
      sessionOptions.store = new RedisStore({ client, prefix: 'openid_session' });
    } else {
      sessionOptions.store = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
    app.use(session(sessionOptions));
    app.use(passport.session());
    const config = await setupOpenId();
    if (isEnabled(process.env.OPENID_REUSE_TOKENS)) {
      logger.info('OpenID token reuse is enabled.');
      passport.use('openidJwt', openIdJwtLogin(config));
    }
    logger.info('OpenID Connect configured.');
  }
  if (
    process.env.SAML_ENTRY_POINT &&
    process.env.SAML_ISSUER &&
    process.env.SAML_CERT &&
    process.env.SAML_SESSION_SECRET
  ) {
    logger.info('Configuring SAML Connect...');
    const sessionOptions = {
      secret: process.env.SAML_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    };
    if (isEnabled(process.env.USE_REDIS)) {
      logger.debug('Using Redis for session storage in SAML...');
      const keyv = new Keyv({ store: keyvRedis });
      const client = keyv.opts.store.client;
      sessionOptions.store = new RedisStore({ client, prefix: 'saml_session' });
    } else {
      sessionOptions.store = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
    app.use(session(sessionOptions));
    app.use(passport.session());
    setupSaml();

    logger.info('SAML Connect configured.');
  }
};

module.exports = configureSocialLogins;
