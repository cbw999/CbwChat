const { promisify } = require('util');
const { exec } = require('child_process');
// console 로그 색상 설정
require('./helpers');

// 현재 운영체제가 윈도우인지 확인
const isWindows = process.platform === 'win32';
// exec 함수를 프로미스 형태로 변환
const execAsync = promisify(exec);

async function main() {
  try {
    if (isWindows) {
      // 윈도우: node.exe 프로세스를 강제 종료
      console.red('The backend process has been terminated');
      await execAsync('taskkill /F /IM node.exe /T');
    } else {
      // 리눅스/맥: api/server/index.js로 실행된 프로세스 종료
      await execAsync('pkill -f api/server/index.js'); 
      console.orange('The backend process has been terminated');
    }
  } catch (err) {
    // 에러 발생 시 메시지 출력
    console.red('The backend process has been terminated', err.message);
  }
}

// 메인 함수 실행
main();
