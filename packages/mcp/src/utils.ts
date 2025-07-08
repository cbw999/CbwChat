/**
 * 서버 이름을 정규화하여 패턴 ^[a-zA-Z0-9_.-]+$ 에 맞게 변환합니다.
 * Azure OpenAI 모델에서 Tool Calling 기능 사용 시 요구되는 형식입니다.
 */
export function normalizeServerName(serverName: string): string {
    // 서버 이름이 이미 정규 패턴을 만족하면 그대로 반환
    if (/^[a-zA-Z0-9_.-]+$/.test(serverName)) {
      return serverName;
    }
  
    /**
     * 정규 패턴에 맞지 않는 문자는 모두 밑줄(_)로 대체합니다.
     * 이때 일반적인 구조를 유지하면서 호환 가능한 이름으로 바꾸는 것이 목적입니다.
     * 또한 앞뒤의 밑줄은 제거합니다.
     */
    const normalized = serverName
      .replace(/[^a-zA-Z0-9_.-]/g, '_') // 허용되지 않은 문자 → _
      .replace(/^_+|_+$/g, '');         // 앞뒤 밑줄 제거
  
    // 만약 모든 문자가 제거되어 결과가 빈 문자열이 되었다면
    // 고유성을 보장하는 fallback 이름을 생성합니다.
    if (!normalized) {
      /**
       * 원본 문자열을 기반으로 단순 해시값을 만들어서
       * 고유한 fallback 서버 이름을 생성합니다.
       */
      let hash = 0;
      for (let i = 0; i < serverName.length; i++) {
        hash = (hash << 5) - hash + serverName.charCodeAt(i);
        hash |= 0; // 32비트 정수로 변환
      }
      return `server_${Math.abs(hash)}`;
    }
  
    // 정규화된 서버 이름 반환
    return normalized;
  }
  