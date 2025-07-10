const fs = require('fs').promises;
const { getImporter } = require('./importers');
const { logger } = require('~/config');

/**
 * Job definition for importing a conversation.
 * 이 코드는 대화(conversation) 데이터를 외부 파일에서 불러와(import) 시스템에 저장하는 백엔드 작업 정의입니다.
 * 흔히 백그라운드 Job 처리 시스템에서 실행되는 단위 작업 함수로 사용됩니다.
 * importConversations(job) 함수는 주어진 파일 경로(filepath)에 있는 JSON 데이터를 읽고,
 * 적절한 import 전략(importer)을 선택하여 대화 데이터를 시스템에 삽입한 후 파일을 삭제합니다.
 * @param {{ filepath, requestUserId }} job - The job object.
 */
const importConversations = async (job) => {
  const { filepath, requestUserId } = job;
  try {
    logger.debug(`user: ${requestUserId} | Importing conversation(s) from file...`);
    const fileData = await fs.readFile(filepath, 'utf8');
    const jsonData = JSON.parse(fileData);
    const importer = getImporter(jsonData);
    await importer(jsonData, requestUserId);
    logger.debug(`user: ${requestUserId} | Finished importing conversations`);
  } catch (error) {
    logger.error(`user: ${requestUserId} | Failed to import conversation: `, error);
  } finally {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      logger.error(`user: ${requestUserId} | Failed to delete file: ${filepath}`, error);
    }
  }
};

module.exports = importConversations;
