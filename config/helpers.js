/**
 * Helper functions
 * 터미널에서 콘솔에 색상을 입히거나, 유틸리티 기능을 제공하는 헬퍼 함수 모음
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// 한 줄 입력을 받는 함수
const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question('\x1b[36m' + query + '\n> ' + '\x1b[0m', (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
};

// 여러 줄 입력을 받는 함수 ('.' 입력 시 종료)
const askMultiLineQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.cyan(query);

  return new Promise((resolve) => {
    let lines = [];
    rl.on('line', (line) => {
      if (line.trim() === '.') {
        rl.close();
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    });
  });
};

// 도커가 실행 중인지 확인하는 함수
function isDockerRunning() {
  try {
    execSync('docker info');
    return true;
  } catch (e) {
    return false;
  }
}

// node_modules 폴더를 삭제하는 함수
function deleteNodeModules(dir) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.purple(`Deleting node_modules in ${dir}`);
    fs.rmSync(nodeModulesPath, { recursive: true });
  }
}

// 조용히 프로세스를 종료하는 함수
const silentExit = (code = 0) => {
  console.log = () => {};
  process.exit(code);
};

// 콘솔 색상 함수 정의
console.orange = (msg) => console.log('\x1b[33m%s\x1b[0m', msg); // 주황색
console.green = (msg) => console.log('\x1b[32m%s\x1b[0m', msg);  // 초록색
console.red = (msg) => console.log('\x1b[31m%s\x1b[0m', msg);    // 빨간색
console.blue = (msg) => console.log('\x1b[34m%s\x1b[0m', msg);   // 파란색
console.purple = (msg) => console.log('\x1b[35m%s\x1b[0m', msg); // 보라색
console.cyan = (msg) => console.log('\x1b[36m%s\x1b[0m', msg);   // 청록색
console.yellow = (msg) => console.log('\x1b[33m%s\x1b[0m', msg); // 노란색
console.white = (msg) => console.log('\x1b[37m%s\x1b[0m', msg);  // 흰색
console.gray = (msg) => console.log('\x1b[90m%s\x1b[0m', msg);   // 회색

module.exports = {
  askQuestion,
  askMultiLineQuestion,
  silentExit,
  isDockerRunning,
  deleteNodeModules,
};
