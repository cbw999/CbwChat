const { MeiliSearch } = require('meilisearch');
const { Conversation } = require('~/models/Conversation');
const { Message } = require('~/models/Message');
const { isEnabled } = require('~/server/utils');
const { logger } = require('~/config');

/**
 * MeiliSearch를 사용하여 MongoDB 기반 데이터 (Conversations & Messages) 와 검색 인덱스 간 동기화(sync) 를 수행하는 로직입니다.
 * 특히 MeiliSearch 인덱스 상태를 확인하고, 필요시 재인덱싱하는 과정을 자동화합니다.
 * MeiliSearch는 오픈소스 기반의 초고속 검색 엔진입니다. 
 */
const searchEnabled = isEnabled(process.env.SEARCH);
const indexingDisabled = isEnabled(process.env.MEILI_NO_SYNC);
let currentTimeout = null;

class MeiliSearchClient {
  static instance = null;

  static getInstance() {
    if (!MeiliSearchClient.instance) {
      if (!process.env.MEILI_HOST || !process.env.MEILI_MASTER_KEY) {
        throw new Error('Meilisearch configuration is missing.');
      }
      MeiliSearchClient.instance = new MeiliSearch({
        host: process.env.MEILI_HOST,
        apiKey: process.env.MEILI_MASTER_KEY,
      });
    }
    return MeiliSearchClient.instance;
  }
}

async function indexSync() {
  if (!searchEnabled) {
    return;
  }

  try {
    const client = MeiliSearchClient.getInstance();

    const { status } = await client.health();
    if (status !== 'available') {
      throw new Error('Meilisearch not available');
    }

    if (indexingDisabled === true) {
      logger.info('[indexSync] Indexing is disabled, skipping...');
      return;
    }

    const messageCount = await Message.countDocuments();
    const convoCount = await Conversation.countDocuments();
    const messages = await client.index('messages').getStats();
    const convos = await client.index('convos').getStats();
    const messagesIndexed = messages.numberOfDocuments;
    const convosIndexed = convos.numberOfDocuments;

    logger.debug(`[indexSync] There are ${messageCount} messages and ${messagesIndexed} indexed`);
    logger.debug(`[indexSync] There are ${convoCount} convos and ${convosIndexed} indexed`);

    if (messageCount !== messagesIndexed) {
      logger.debug('[indexSync] Messages out of sync, indexing');
      Message.syncWithMeili();
    }

    if (convoCount !== convosIndexed) {
      logger.debug('[indexSync] Convos out of sync, indexing');
      Conversation.syncWithMeili();
    }
  } catch (err) {
    if (err.message.includes('not found')) {
      logger.debug('[indexSync] Creating indices...');
      currentTimeout = setTimeout(async () => {
        try {
          await Message.syncWithMeili();
          await Conversation.syncWithMeili();
        } catch (err) {
          logger.error('[indexSync] Trouble creating indices, try restarting the server.', err);
        }
      }, 750);
    } else if (err.message.includes('Meilisearch not configured')) {
      logger.info('[indexSync] Meilisearch not configured, search will be disabled.');
    } else {
      logger.error('[indexSync] error', err);
    }
  }
}

process.on('exit', () => {
  logger.debug('[indexSync] Clearing sync timeouts before exiting...');
  clearTimeout(currentTimeout);
});

module.exports = indexSync;
