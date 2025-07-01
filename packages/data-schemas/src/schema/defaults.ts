import { Schema } from 'mongoose';

// @ts-ignore
export const conversationPreset = {
  // 사용하려는 엔드포인트 종류 (azureOpenAI, openAI, anthropic, chatGPTBrowser 등)
  endpoint: {
    type: String,
    default: null,
    required: true,
  },
  // 엔드포인트의 타입 지정
  endpointType: {
    type: String,
  },
  // azureOpenAI, openAI, chatGPTBrowser에서 사용할 모델 이름
  model: {
    type: String,
    required: false,
  },
  // AWS Bedrock용 리전 설정
  region: {
    type: String,
    required: false,
  },
  // chatGPT UI에서 사용할 레이블 (azureOpenAI, openAI만 해당)
  chatGptLabel: {
    type: String,
    required: false,
  },
  // Google 모델 전용 - 예시 제공
  examples: { type: [{ type: Schema.Types.Mixed }], default: undefined },
  // 모델 이름에 대한 레이블 (표시용)
  modelLabel: {
    type: String,
    required: false,
  },
  // 프롬프트 앞에 붙일 텍스트 (시스템 지시어 역할)
  promptPrefix: {
    type: String,
    required: false,
  },
  // 샘플링 온도 (창의성 제어)
  temperature: {
    type: Number,
    required: false,
  },
  // 확률 분포의 누적값 제한 (Top-p 샘플링 제어)
  top_p: {
    type: Number,
    required: false,
  },
  // Google 모델 전용 TopP
  topP: {
    type: Number,
    required: false,
  },
  // Top-k 샘플링을 위한 설정 (가장 가능성 높은 k개만 고려)
  topK: {
    type: Number,
    required: false,
  },
  // 출력 토큰 최대 수 (Google용)
  maxOutputTokens: {
    type: Number,
    required: false,
  },
  // 출력 토큰 최대 수 (OpenAI용)
  maxTokens: {
    type: Number,
    required: false,
  },
  // 새로움 강조 정도 (같은 내용 반복 방지)
  presence_penalty: {
    type: Number,
    required: false,
  },
  // 반복 사용 억제 정도
  frequency_penalty: {
    type: Number,
    required: false,
  },
  // 연결된 파일 ID 목록
  file_ids: { type: [{ type: String }], default: undefined },
  // (더 이상 사용되지 않음) 이미지를 다시 전송할지 여부
  resendImages: {
    type: Boolean,
  },
  /* Anthropic 전용 설정 */
  // 프롬프트 캐시 사용 여부
  promptCache: {
    type: Boolean,
  },
  // 생각 중 상태 표시 여부
  thinking: {
    type: Boolean,
  },
  // 생각 시간(예산) 설정
  thinkingBudget: {
    type: Number,
  },
  // 시스템 메시지 설정
  system: {
    type: String,
  },
  // 파일을 다시 전송할지 여부
  resendFiles: {
    type: Boolean,
  },
  // 이미지 세부정보 수준 (예: low, high 등)
  imageDetail: {
    type: String,
  },
  /* 에이전트 관련 설정 */
  // 에이전트 ID
  agent_id: {
    type: String,
  },
  /* 어시스턴트 관련 설정 */
  // 어시스턴트 ID
  assistant_id: {
    type: String,
  },
  // 사용자 지침
  instructions: {
    type: String,
  },
  // 대화 중 정지 조건 (예: 특정 단어 등)
  stop: { type: [{ type: String }], default: undefined },
  // 보관 여부 (UI에서 숨김 등)
  isArchived: {
    type: Boolean,
    default: false,
  },
  /* UI 구성 요소 */
  // 아이콘 URL
  iconURL: {
    type: String,
  },
  // 처음 인사말
  greeting: {
    type: String,
  },
  // 사양 정보 (내부 설명 또는 메타데이터)
  spec: {
    type: String,
  },
  // 태그 목록
  tags: {
    type: [String],
    default: [],
  },
  // 도구 목록 (예: 브라우저, 계산기 등)
  tools: { type: [{ type: String }], default: undefined },
  // 최대 컨텍스트 토큰 수
  maxContextTokens: {
    type: Number,
  },
  // 최대 토큰 수 (일반용)
  max_tokens: {
    type: Number,
  },
  /** Omni 모델 전용 설정 */
  // 추론 노력 수준 (예: low, medium, high 등)
  reasoning_effort: {
    type: String,
  },
};
