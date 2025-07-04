// 콘텐츠 유형을 정의하는 열거형
export enum ContentTypes {
    TEXT = 'text', // 일반 텍스트
    THINK = 'think', // 내부 사고 또는 생각 표현
    TEXT_DELTA = 'text_delta', // 텍스트 변경(차이) 정보
    TOOL_CALL = 'tool_call', // 도구 호출
    IMAGE_FILE = 'image_file', // 이미지 파일
    IMAGE_URL = 'image_url', // 이미지 URL
    AGENT_UPDATE = 'agent_update', // 에이전트 상태 업데이트
    ERROR = 'error', // 오류 메시지
  }
  
  // 단계 유형을 정의하는 열거형
  export enum StepTypes {
    TOOL_CALLS = 'tool_calls', // 도구 호출 단계
    MESSAGE_CREATION = 'message_creation', // 메시지 생성 단계
  }
  
  // 도구 호출 유형을 정의하는 열거형
  export enum ToolCallTypes {
    FUNCTION = 'function', // 함수 호출
    RETRIEVAL = 'retrieval', // 정보 검색
    FILE_SEARCH = 'file_search', // 파일 검색
    CODE_INTERPRETER = 'code_interpreter', // 코드 인터프리터 사용
    /* 에이전트의 도구 호출 */
    TOOL_CALL = 'tool_call', // 일반 도구 호출 (에이전트용)
  }
  