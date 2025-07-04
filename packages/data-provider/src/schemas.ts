import { z } from 'zod';
import { Tools } from './types/assistants';
import type { TMessageContentParts, FunctionTool, FunctionToolCall } from './types/assistants';
import type { SearchResultData } from './types/web';
import type { TEphemeralAgent } from './types';
import type { TFile } from './types/files';

// 문자열이 UUID 형식인지 검증하는 zod 스키마 정의
export const isUUID = z.string().uuid();

// 인증 방식(enum) 정의
export enum AuthType {
  OVERRIDE_AUTH = 'override_auth',      // 시스템이 인증을 덮어쓰는 경우
  USER_PROVIDED = 'user_provided',      // 사용자가 제공한 인증 정보
  SYSTEM_DEFINED = 'system_defined',    // 시스템에서 정의된 인증 방식
}

// 인증 방식 검증을 위한 zod 스키마 (위 enum을 nativeEnum으로 사용)
export const authTypeSchema = z.nativeEnum(AuthType);

// 모델 엔드포인트(enum) 정의
export enum EModelEndpoint {
  azureOpenAI = 'azureOpenAI',         // Azure에서 제공하는 OpenAI
  openAI = 'openAI',                   // OpenAI 기본 엔드포인트
  google = 'google',                   // Google 모델
  anthropic = 'anthropic',             // Anthropic 모델
  assistants = 'assistants',           // 어시스턴트 엔드포인트
  azureAssistants = 'azureAssistants', // Azure 기반 어시스턴트
  agents = 'agents',                   // 에이전트 관련 엔드포인트
  custom = 'custom',                   // 사용자 정의 엔드포인트
  bedrock = 'bedrock',                 // AWS Bedrock 기반 모델
  /** @deprecated 더 이상 사용되지 않음 */
  chatGPTBrowser = 'chatGPTBrowser',
  /** @deprecated 더 이상 사용되지 않음 */
  gptPlugins = 'gptPlugins',
}

// 파라미터로 사용할 수 있는 엔드포인트 집합 정의
export const paramEndpoints = new Set<EModelEndpoint | string>([
  EModelEndpoint.agents,
  EModelEndpoint.openAI,
  EModelEndpoint.bedrock,
  EModelEndpoint.azureOpenAI,
  EModelEndpoint.anthropic,
  EModelEndpoint.custom,
  EModelEndpoint.google,
]);

// Amazon Bedrock은 AWS에서 제공하는 서드파티 AI 모델을 API로 쉽게 사용할 수 있게 해주는 서비스
// Bedrock에서 지원하는 모델 제공자(enum) 정의
export enum BedrockProviders {
  AI21 = 'ai21',               // AI21 Labs
  Amazon = 'amazon',           // Amazon 자체 모델
  Anthropic = 'anthropic',     // Anthropic
  Cohere = 'cohere',           // Cohere
  Meta = 'meta',               // Meta (ex. Facebook)
  MistralAI = 'mistral',       // Mistral AI
  StabilityAI = 'stability',   // Stability AI
  DeepSeek = 'deepseek',       // DeepSeek
}

// 모델 키를 추출하는 함수
// Bedrock의 경우에는 모델명에서 제공자(provider)를 추출하고,
// 그렇지 않으면 모델명을 그대로 반환
export const getModelKey = (endpoint: EModelEndpoint | string, model: string) => {
  if (endpoint === EModelEndpoint.bedrock) {
    const parts = model.split('.'); // 모델명을 '.' 기준으로 분할
    const provider = [parts[0], parts[1]].find((part) =>
      Object.values(BedrockProviders).includes(part as BedrockProviders),
    );
    return (provider ?? parts[0]) as BedrockProviders; // 제공자 추출 or 기본값 사용
  }
  return model; // Bedrock이 아닌 경우 그대로 반환
};

// 엔드포인트와 모델명을 기반으로 고유 설정 키를 생성하는 함수
export const getSettingsKeys = (endpoint: EModelEndpoint | string, model: string) => {
  const endpointKey = endpoint;
  const modelKey = getModelKey(endpointKey, model); // 모델 제공자 키 추출
  const combinedKey = `${endpointKey}-${modelKey}`; // 조합 키 생성 (예: openAI-gpt-4)
  return [combinedKey, endpointKey]; // 설정용 키 배열 반환
};

// 어시스턴트 엔드포인트 타입 (두 종류만 허용)
export type AssistantsEndpoint = EModelEndpoint.assistants | EModelEndpoint.azureAssistants;

// 어시스턴트 관련 엔드포인트인지 여부 확인
export const isAssistantsEndpoint = (_endpoint?: AssistantsEndpoint | null | string): boolean => {
  const endpoint = _endpoint ?? ''; // null 또는 undefined일 경우 빈 문자열로 처리
  if (!endpoint) {
    return false;
  }
  // 문자열이 'assistants'로 끝나는지 확인 (대소문자 무시)
  return endpoint.toLowerCase().endsWith(EModelEndpoint.assistants);
};

// agent 외의 모든 EModelEndpoint 키 (keyof)를 타입으로 정의 + 문자열 허용
export type AgentProvider = Exclude<keyof typeof EModelEndpoint, EModelEndpoint.agents> | string;

// agents 엔드포인트인지 여부 확인
export const isAgentsEndpoint = (_endpoint?: EModelEndpoint.agents | null | string): boolean => {
  const endpoint = _endpoint ?? '';
  if (!endpoint) {
    return false;
  }
  return endpoint === EModelEndpoint.agents;
};

// 일시적(임시) agent인지 확인하는 함수
export const isEphemeralAgent = (
  endpoint?: EModelEndpoint.agents | null | string,
  ephemeralAgent?: TEphemeralAgent | null,
) => {
  // 에이전트 정보가 없으면 false
  if (!ephemeralAgent) {
    return false;
  }
  // agents 엔드포인트면 임시 agent가 아님
  if (isAgentsEndpoint(endpoint)) {
    return false;
  }
  // 임시 agent가 사용 설정된 기능을 포함하고 있는지 확인
  const hasMCPSelected = (ephemeralAgent?.mcp?.length ?? 0) > 0;       // MCP 선택 여부
  const hasCodeSelected = (ephemeralAgent?.execute_code ?? false) === true; // 코드 실행 여부
  const hasSearchSelected = (ephemeralAgent?.web_search ?? false) === true; // 웹 검색 여부
  // 위 조건 중 하나라도 만족하면 임시 agent
  return hasMCPSelected || hasCodeSelected || hasSearchSelected;
};

// 주어진 endpoint 또는 endpointType이 paramEndpoints에 포함되어 있는지 확인
export const isParamEndpoint = (
  endpoint: EModelEndpoint | string,
  endpointType?: EModelEndpoint | string,
): boolean => {
  if (paramEndpoints.has(endpoint)) {
    return true;
  }

  if (endpointType != null) {
    return paramEndpoints.has(endpointType);
  }

  return false;
};

// 이미지 디테일 수준을 나타내는 enum
export enum ImageDetail {
  low = 'low',     // 저화질
  auto = 'auto',   // 자동
  high = 'high',   // 고화질
}

// 추론 수준을 나타내는 enum (AI reasoning 수준)
export enum ReasoningEffort {
  low = 'low',      // 낮은 추론 노력
  medium = 'medium',// 중간 수준
  high = 'high',    // 높은 수준
}

// 이미지 디테일 수준을 숫자로 매핑한 객체
export const imageDetailNumeric = {
  [ImageDetail.low]: 0,
  [ImageDetail.auto]: 1,
  [ImageDetail.high]: 2,
};

// 숫자를 이미지 디테일 enum 값으로 되돌리는 매핑
export const imageDetailValue = {
  0: ImageDetail.low,
  1: ImageDetail.auto,
  2: ImageDetail.high,
};

// ImageDetail 열거형(enum)을 기반으로 Zod 스키마 생성
export const eImageDetailSchema = z.nativeEnum(ImageDetail);

// ReasoningEffort 열거형(enum)을 기반으로 Zod 스키마 생성
export const eReasoningEffortSchema = z.nativeEnum(ReasoningEffort);

// Assistant 폼의 기본 값 정의
export const defaultAssistantFormValues = {
  assistant: '',                          // Assistant 고유 식별자
  id: '',                                 // 폼의 ID
  name: '',                               // 이름
  description: '',                        // 설명
  instructions: '',                       // 지시사항
  conversation_starters: [],             // 대화 시작 문장 배열
  model: '',                              // 사용할 모델 이름
  functions: [],                          // 함수들 (FunctionTool)
  code_interpreter: false,               // 코드 해석기 사용 여부
  image_vision: false,                   // 이미지 비전 기능 사용 여부
  retrieval: false,                      // 검색 기능 사용 여부
  append_current_datetime: false,        // 현재 날짜/시간 추가 여부
};

// Agent 폼의 기본 값 정의
export const defaultAgentFormValues = {
  agent: {},                              // 에이전트 설정 객체
  id: '',                                 // 에이전트 ID
  name: '',                               // 이름
  description: '',                        // 설명
  instructions: '',                       // 지시사항
  model: '',                              // 사용할 모델 이름
  model_parameters: {},                   // 모델 파라미터 설정
  tools: [],                              // 사용 도구 목록
  provider: {},                           // 모델 제공자 정보
  projectIds: [],                         // 연관된 프로젝트 ID 배열
  artifacts: '',                          // 산출물 정보
  isCollaborative: false,                // 협업 가능 여부
  recursion_limit: undefined,            // 재귀 제한 (선택적)
  [Tools.execute_code]: false,           // 코드 실행 도구 사용 여부
  [Tools.file_search]: false,            // 파일 검색 도구 사용 여부
  [Tools.web_search]: false,             // 웹 검색 도구 사용 여부
};

// 이미지 비전 도구 정의 (FunctionTool 형식)
export const ImageVisionTool: FunctionTool = {
  type: Tools.function,                  // 도구 타입: function
  [Tools.function]: {
    name: 'image_vision',                // 기능 이름
    description: '첨부된 이미지에 대한 자세한 설명을 가져옵니다.', // 기능 설명
    parameters: {
      type: 'object',                    // 입력 파라미터의 타입
      properties: {},                    // 입력 속성 정의 (현재 없음)
      required: [],                      // 필수 속성 없음
    },
  },
};

// 주어진 도구가 이미지 비전 도구인지 확인하는 함수
export const isImageVisionTool = (tool: FunctionTool | FunctionToolCall) =>
  tool.type === 'function' && tool.function?.name === ImageVisionTool.function?.name;

// OpenAI 설정 값들 정의
export const openAISettings = {
  model: {
    default: 'gpt-4o-mini' as const,     // 기본 모델 이름
  },
  temperature: {
    min: 0 as const,                     // 최소 값
    max: 2 as const,                     // 최대 값
    step: 0.01 as const,                 // 조정 단위
    default: 1 as const,                 // 기본 값
  },
  top_p: {
    min: 0 as const,
    max: 1 as const,
    step: 0.01 as const,
    default: 1 as const,
  },
  presence_penalty: {
    min: 0 as const,
    max: 2 as const,
    step: 0.01 as const,
    default: 0 as const,
  },
  frequency_penalty: {
    min: 0 as const,
    max: 2 as const,
    step: 0.01 as const,
    default: 0 as const,
  },
  resendFiles: {
    default: true as const,              // 파일을 다시 전송할지 여부 (기본: true)
  },
  maxContextTokens: {
    default: undefined,                  // 최대 컨텍스트 토큰 수 (설정되지 않음)
  },
  max_tokens: {
    default: undefined,                  // 최대 생성 토큰 수 (설정되지 않음)
  },
  imageDetail: {
    default: ImageDetail.auto as const,  // 기본 이미지 상세 수준 (자동)
    min: 0 as const,
    max: 2 as const,
    step: 1 as const,
  },
};

// ✅ Google 모델 설정
export const googleSettings = {
  model: {
    default: 'gemini-1.5-flash-latest' as const, // 기본 모델 이름
  },
  maxOutputTokens: {
    min: 1 as const,             // 최소 출력 토큰 수
    max: 64000 as const,         // 최대 출력 토큰 수
    step: 1 as const,            // 증가 단위
    default: 8192 as const,      // 기본 출력 토큰 수
  },
  temperature: {
    min: 0 as const,             // 최소 temperature 값 (창의성 ↓)
    max: 2 as const,             // 최대 temperature 값 (창의성 ↑)
    step: 0.01 as const,         // 조정 단위
    default: 1 as const,         // 기본 값
  },
  topP: {
    min: 0 as const,             // top-p 최소값
    max: 1 as const,             // top-p 최대값
    step: 0.01 as const,         // 조정 단위
    default: 0.95 as const,      // 기본 top-p 값
  },
  topK: {
    min: 1 as const,             // top-k 최소값
    max: 40 as const,            // top-k 최대값
    step: 1 as const,            // 조정 단위
    default: 40 as const,        // 기본 top-k 값
  },
};

// ✅ Anthropic 모델 설정 관련 상수
const ANTHROPIC_MAX_OUTPUT = 128000 as const;         // 최신 모델 최대 출력 토큰 수
const DEFAULT_MAX_OUTPUT = 8192 as const;             // 기본 출력 토큰 수
const LEGACY_ANTHROPIC_MAX_OUTPUT = 4096 as const;    // 구형 모델 최대 출력 토큰 수

// ✅ Anthropic 모델 설정
export const anthropicSettings = {
  model: {
    default: 'claude-3-5-sonnet-latest' as const, // 기본 모델 이름
  },
  temperature: {
    min: 0 as const,
    max: 1 as const,
    step: 0.01 as const,
    default: 1 as const,
  },
  promptCache: {
    default: true as const, // 프롬프트 캐시 사용 여부
  },
  thinking: {
    default: true as const, // 추론 시간 예산 기능 사용 여부
  },
  thinkingBudget: {
    min: 1024 as const,       // 최소 예산 (토큰 기준)
    step: 100 as const,       // 증가 단위
    max: 200000 as const,     // 최대 예산
    default: 2000 as const,   // 기본 예산
  },
  maxOutputTokens: {
    min: 1 as const,                     // 최소 출력 토큰
    max: ANTHROPIC_MAX_OUTPUT,          // 최대 출력 토큰
    step: 1 as const,                   // 증가 단위
    default: DEFAULT_MAX_OUTPUT,       // 기본 출력 토큰

    // 모델 이름에 따라 기본 출력 토큰 값을 리셋하는 함수
    reset: (modelName: string) => {
      if (/claude-3[-.]5-sonnet/.test(modelName) || /claude-3[-.]7/.test(modelName)) {
        return DEFAULT_MAX_OUTPUT;
      }
      return 4096;
    },

    // 특정 모델에 따라 허용 가능한 출력 토큰 수를 제한하는 함수
    set: (value: number, modelName: string) => {
      if (
        !(/claude-3[-.]5-sonnet/.test(modelName) || /claude-3[-.]7/.test(modelName)) &&
        value > LEGACY_ANTHROPIC_MAX_OUTPUT
      ) {
        return LEGACY_ANTHROPIC_MAX_OUTPUT;
      }

      return value;
    },
  },
  topP: {
    min: 0 as const,
    max: 1 as const,
    step: 0.01 as const,
    default: 0.7 as const,
  },
  topK: {
    min: 1 as const,
    max: 40 as const,
    step: 1 as const,
    default: 5 as const,
  },
  resendFiles: {
    default: true as const,  // 파일 재전송 여부
  },
  maxContextTokens: {
    default: undefined,      // 최대 컨텍스트 토큰 수 (미지정)
  },

  // 구형(legacy) 모델용 설정
  legacy: {
    maxOutputTokens: {
      min: 1 as const,
      max: LEGACY_ANTHROPIC_MAX_OUTPUT,
      step: 1 as const,
      default: LEGACY_ANTHROPIC_MAX_OUTPUT,
    },
  },
};

// ✅ Agents 엔드포인트(GPT 기반) 설정
export const agentsSettings = {
  model: {
    default: 'gpt-3.5-turbo-test' as const, // 기본 모델 이름
  },
  temperature: {
    min: 0 as const,       // 최소 temperature (창의성 ↓)
    max: 1 as const,       // 최대 temperature (창의성 ↑)
    step: 0.01 as const,   // 조정 단위
    default: 1 as const,   // 기본 값
  },
  top_p: {
    min: 0 as const,       // top-p 최소값
    max: 1 as const,       // top-p 최대값
    step: 0.01 as const,   // 조정 단위
    default: 1 as const,   // 기본 top-p 값
  },
  presence_penalty: {
    min: 0 as const,       // 새로운 주제 등장에 대한 패널티 (최소)
    max: 2 as const,       // 최대
    step: 0.01 as const,   // 조정 단위
    default: 0 as const,   // 기본 값
  },
  frequency_penalty: {
    min: 0 as const,       // 반복 표현에 대한 패널티 (최소)
    max: 2 as const,       // 최대
    step: 0.01 as const,
    default: 0 as const,
  },
  resendFiles: {
    default: true as const, // 파일 재전송 여부
  },
  maxContextTokens: {
    default: undefined,     // 최대 컨텍스트 토큰 수 (지정되지 않음)
  },
  max_tokens: {
    default: undefined,     // 최대 출력 토큰 수 (지정되지 않음)
  },
  imageDetail: {
    default: ImageDetail.auto as const, // 이미지 처리 수준 (자동)
  },
};

// ✅ 모델 엔드포인트별 설정 객체 모음
export const endpointSettings = {
  [EModelEndpoint.openAI]: openAISettings,         // OpenAI 설정
  [EModelEndpoint.google]: googleSettings,         // Google 설정
  [EModelEndpoint.anthropic]: anthropicSettings,   // Anthropic 설정
  [EModelEndpoint.agents]: agentsSettings,         // 사용자 정의 Agents 설정
  [EModelEndpoint.bedrock]: agentsSettings,        // Bedrock도 같은 설정 사용
};

// ✅ Google 설정 일부를 가져옴 (사용 예시일 수 있음)
const google = endpointSettings[EModelEndpoint.google];

// ✅ 모델 엔드포인트 enum 값을 위한 Zod 스키마
export const eModelEndpointSchema = z.nativeEnum(EModelEndpoint);

// ✅ 확장된 엔드포인트 스키마: enum 값 또는 임의 문자열 허용
export const extendedModelEndpointSchema = z.union([eModelEndpointSchema, z.string()]);

// ✅ 플러그인의 인증 필드 구성 스키마 정의
export const tPluginAuthConfigSchema = z.object({
  authField: z.string(),     // 인증 필드 이름
  label: z.string(),         // 라벨
  description: z.string(),   // 설명
});

// ✅ 인증 필드 설정 타입 추출
export type TPluginAuthConfig = z.infer<typeof tPluginAuthConfigSchema>;

// ✅ 플러그인 전체 구조 스키마 정의
export const tPluginSchema = z.object({
  name: z.string(),                            // 플러그인 이름
  pluginKey: z.string(),                       // 고유 키
  description: z.string(),                     // 설명
  icon: z.string().optional(),                 // 아이콘 (선택)
  authConfig: z.array(tPluginAuthConfigSchema).optional(), // 인증 필드 배열 (선택)
  authenticated: z.boolean().optional(),       // 인증 여부
  chatMenu: z.boolean().optional(),            // 채팅 메뉴 포함 여부
  isButton: z.boolean().optional(),            // 버튼 형태인지 여부
  toolkit: z.boolean().optional(),             // 툴킷 포함 여부
});

// ✅ 플러그인 타입 추출
export type TPlugin = z.infer<typeof tPluginSchema>;

// ✅ 사용자 입력 데이터 타입 정의
export type TInput = {
  inputStr: string; // 입력 문자열
};

// ✅ 플러그인 실행 결과 타입 정의
export type TResPlugin = {
  plugin: string;         // 플러그인 이름
  input: string;          // 입력값
  thought: string;        // AI의 사고/판단 내용
  loading?: boolean;      // 로딩 상태 (선택)
  outputs?: string;       // 출력값 (선택)
  latest?: string;        // 최신 응답 (선택)
  inputs?: TInput[];      // 입력 배열 (선택)
};

// ✅ 입출력 예제 스키마 정의 (예: 테스트 케이스용)
export const tExampleSchema = z.object({
  input: z.object({
    content: z.string(),   // 입력 텍스트
  }),
  output: z.object({
    content: z.string(),   // 출력 텍스트
  }),
});

// tExampleSchema를 기반으로 타입 추론하여 TExample 타입 정의
export type TExample = z.infer<typeof tExampleSchema>;

// 에이전트 종류를 정의하는 열거형(enum)
export enum EAgent {
  functions = 'functions', // 함수 기반 에이전트
  classic = 'classic',     // 전통적인 에이전트
}

// 에이전트 관련 기본 설정값들 정의
export const agentOptionSettings = {
  model: {
    default: 'gpt-4o-mini', // 기본 모델 이름
  },
  temperature: {
    min: 0,     // 최소 온도
    max: 1,     // 최대 온도
    step: 0.01, // 온도 증가 단위
    default: 0, // 기본 온도 값
  },
  agent: {
    default: EAgent.functions, // 기본 에이전트 타입
    options: [EAgent.functions, EAgent.classic], // 선택 가능한 에이전트 옵션들
  },
  skipCompletion: {
    default: true, // 응답 생략 여부 기본값
  },
};

// EAgent enum을 기반으로 하는 zod 스키마
export const eAgentOptionsSchema = z.nativeEnum(EAgent);

// 에이전트 옵션에 대한 zod 스키마 정의
export const tAgentOptionsSchema = z.object({
  agent: z.string().default(EAgent.functions), // 에이전트 타입
  skipCompletion: z.boolean().default(agentOptionSettings.skipCompletion.default), // 응답 생략 여부
  model: z.string(), // 모델 이름
  temperature: z.number().default(agentOptionSettings.temperature.default), // 온도
});

// 메시지 스키마 정의
export const tMessageSchema = z.object({
  messageId: z.string(), // 메시지 고유 ID
  endpoint: z.string().optional(), // API 엔드포인트 (옵션)
  clientId: z.string().nullable().optional(), // 클라이언트 ID
  conversationId: z.string().nullable(), // 대화 ID
  parentMessageId: z.string().nullable(), // 부모 메시지 ID
  responseMessageId: z.string().nullable().optional(), // 응답 메시지 ID
  overrideParentMessageId: z.string().nullable().optional(), // 부모 메시지 ID 재정의
  bg: z.string().nullable().optional(), // 배경 설정
  model: z.string().nullable().optional(), // 사용된 모델
  title: z.string().nullable().or(z.literal('New Chat')).default('New Chat'), // 대화 제목
  sender: z.string().optional(), // 발신자
  text: z.string(), // 메시지 텍스트
  generation: z.string().nullable().optional(), // 생성 정보
  isCreatedByUser: z.boolean(), // 사용자가 생성한 메시지 여부
  error: z.boolean().optional(), // 오류 여부
  clientTimestamp: z.string().optional(), // 클라이언트 측 타임스탬프
  createdAt: z.string().optional().default(() => new Date().toISOString()), // 생성일시
  updatedAt: z.string().optional().default(() => new Date().toISOString()), // 수정일시
  current: z.boolean().optional(), // 현재 메시지 여부
  unfinished: z.boolean().optional(), // 미완성 메시지 여부
  searchResult: z.boolean().optional(), // 검색 결과 여부
  finish_reason: z.string().optional(), // 응답 종료 이유

  /* assistant 관련 필드 */
  thread_id: z.string().optional(),

  /* 프론트엔드 관련 필드 */
  iconURL: z.string().nullable().optional(), // 아이콘 URL
});

// 첨부파일 메타데이터 타입 정의
export type TAttachmentMetadata = {
  type?: Tools; // 도구 유형
  messageId: string; // 메시지 ID
  toolCallId: string; // 도구 호출 ID
  [Tools.web_search]?: SearchResultData; // 웹 검색 결과 데이터
};

// 첨부파일 전체 타입 정의
export type TAttachment =
  | (TFile & TAttachmentMetadata) // 파일 + 메타데이터
  | (Pick<TFile, 'filename' | 'filepath' | 'conversationId'> & {
      expiresAt: number; // 만료 시각
    } & TAttachmentMetadata);

// 메시지 타입 정의 (스키마 기반 + 확장 필드 포함)
export type TMessage = z.input<typeof tMessageSchema> & {
  children?: TMessage[]; // 자식 메시지들 (트리 구조용)
  plugin?: TResPlugin | null;
  plugins?: TResPlugin[];
  content?: TMessageContentParts[];
  files?: Partial<TFile>[];
  depth?: number; // 메시지 깊이
  siblingIndex?: number; // 형제 메시지 인덱스
  attachments?: TAttachment[]; // 첨부파일
  clientTimestamp?: string; // 클라이언트 타임스탬프
};

// 문자열 또는 숫자를 숫자로 강제 변환하는 유틸리티
export const coerceNumber = z.union([z.number(), z.string()]).transform((val) => {
  if (typeof val === 'string') {
    return val.trim() === '' ? undefined : parseFloat(val); // 공백 문자열은 undefined로 처리
  }
  return val;
});

// JSON 유효성 검사용 타입 정의 (재귀 구조)
type DocumentTypeValue =
  | null
  | boolean
  | number
  | string
  | DocumentTypeValue[]
  | { [key: string]: DocumentTypeValue };

// DocumentType 스키마 정의 (재귀 구조 지원)
const DocumentType: z.ZodType<DocumentTypeValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(z.lazy(() => DocumentType)), // 배열
    z.record(z.lazy(() => DocumentType)), // 객체
  ]),
);

// 전체 대화(conversation) 스키마 정의
export const tConversationSchema = z.object({
  conversationId: z.string().nullable(), // 대화 ID
  endpoint: eModelEndpointSchema.nullable(), // 모델 엔드포인트
  endpointType: eModelEndpointSchema.nullable().optional(), // 엔드포인트 타입
  isArchived: z.boolean().optional(), // 보관 여부
  title: z.string().nullable().or(z.literal('New Chat')).default('New Chat'), // 제목
  user: z.string().optional(), // 사용자
  messages: z.array(z.string()).optional(), // 메시지 ID 배열
  tools: z.union([z.array(tPluginSchema), z.array(z.string())]).optional(), // 사용 도구들
  modelLabel: z.string().nullable().optional(),
  userLabel: z.string().optional(),
  model: z.string().nullable().optional(),
  promptPrefix: z.string().nullable().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  top_p: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  parentMessageId: z.string().optional(),
  maxOutputTokens: coerceNumber.optional(),
  maxContextTokens: coerceNumber.optional(),
  max_tokens: coerceNumber.optional(),

  /* Anthropic 관련 */
  promptCache: z.boolean().optional(),
  system: z.string().optional(),
  thinking: z.boolean().optional(),
  thinkingBudget: coerceNumber.optional(),

  /* 산출물 */
  artifacts: z.string().optional(),

  /* 구글 관련 */
  context: z.string().nullable().optional(),
  examples: z.array(tExampleSchema).optional(),

  /* DB 관련 */
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),

  /* 파일 관련 */
  resendFiles: z.boolean().optional(),
  file_ids: z.array(z.string()).optional(),

  /* 비전 모델 관련 */
  imageDetail: eImageDetailSchema.optional(),

  /* OpenAI 전용 설정 */
  reasoning_effort: eReasoningEffortSchema.optional(),

  /* assistant 관련 설정 */
  assistant_id: z.string().optional(),

  /* agent 관련 설정 */
  agent_id: z.string().optional(),

  /* AWS Bedrock 관련 설정 */
  region: z.string().optional(),
  maxTokens: coerceNumber.optional(),
  additionalModelRequestFields: DocumentType.optional(),

  /* instructions 관련 */
  instructions: z.string().optional(),
  additional_instructions: z.string().optional(),
  append_current_datetime: z.boolean().optional(),

  /** Preset 저장 시 사용되는 설정 덮어쓰기 */
  presetOverride: z.record(z.unknown()).optional(),

  stop: z.array(z.string()).optional(),

  /* 프론트엔드 구성 요소 */
  greeting: z.string().optional(),
  spec: z.string().nullable().optional(),
  iconURL: z.string().nullable().optional(),

  /* 임시 채팅용 */
  expiredAt: z.string().nullable().optional(),

  /** @deprecated: 더 이상 사용되지 않음 */
  resendImages: z.boolean().optional(),
  agentOptions: tAgentOptionsSchema.nullable().optional(),

  /** @deprecated: modelLabel 사용 권장 */
  chatGptLabel: z.string().nullable().optional(),
});

// tPresetSchema: 기존 대화 스키마(tConversationSchema)에서 일부 필드를 제거하고 새로운 프리셋 관련 필드들을 병합
export const tPresetSchema = tConversationSchema
  .omit({
    conversationId: true, // 기존 대화 ID 제거
    createdAt: true, // 생성 시간 제거
    updatedAt: true, // 수정 시간 제거
    title: true, // 제목 제거
  })
  .merge(
    z.object({
      conversationId: z.string().nullable().optional(), // 대화 ID (선택적, null 허용)
      presetId: z.string().nullable().optional(), // 프리셋 ID (선택적, null 허용)
      title: z.string().nullable().optional(), // 제목 (선택적, null 허용)
      defaultPreset: z.boolean().optional(), // 기본 프리셋 여부 (선택적)
      order: z.number().optional(), // 정렬 순서 (선택적)
      endpoint: extendedModelEndpointSchema.nullable(), // 모델 엔드포인트 (null 허용)
    }),
  );

// tConvoUpdateSchema: 대화 스키마에 endpoint 및 시간 관련 필드들을 병합한 스키마
export const tConvoUpdateSchema = tConversationSchema.merge(
  z.object({
    endpoint: extendedModelEndpointSchema.nullable(), // 모델 엔드포인트 (null 허용)
    createdAt: z.string().optional(), // 생성 시간 (선택적)
    updatedAt: z.string().optional(), // 수정 시간 (선택적)
  }),
);

// tQueryParamsSchema: 대화 스키마에서 특정 필드만 선택한 후, endpoint 필드를 추가로 병합한 쿼리 파라미터용 스키마
export const tQueryParamsSchema = tConversationSchema
  .pick({
    // LibreChat 관련 설정
    /** 사용할 모델 스펙 */
    spec: true,
    /** AI 컨텍스트 창 크기, model 값 기반 기본값을 덮어씀 */
    maxContextTokens: true,
    /** 이전 메시지의 파일들을 다음 메시지에도 재전송할지 여부 */
    resendFiles: true,
    /**
     * @endpoints: openAI, custom, azureOpenAI
     * 이미지 상세 정보, OpenAI 스펙에 따라 리사이징 처리 (기본값: auto)
     */
    imageDetail: true,
    /**
     * 사용자 정의 지침: system 메시지로 대화 기록에 동적으로 추가됨
     * bedrock: system 모델 파라미터로 사용
     * assistants: additional_instructions 파라미터로 사용
     */
    promptPrefix: true,

    // 모델 관련 파라미터
    /** 사용 모델 종류 */
    model: true,
    /** 모델의 temperature 값 */
    temperature: true,
    /** presence_penalty 설정 */
    presence_penalty: true,
    /** frequency_penalty 설정 */
    frequency_penalty: true,
    /** stop 토큰 설정 */
    stop: true,
    /** top_p 설정 */
    top_p: true,
    /** max_tokens 설정 */
    max_tokens: true,

    // 다른 플랫폼에 따른 설정
    topP: true, // google, anthropic
    topK: true, // google, anthropic
    maxOutputTokens: true, // google, anthropic
    promptCache: true, // anthropic
    thinking: true,
    thinkingBudget: true,
    region: true, // bedrock
    maxTokens: true, // bedrock
    agent_id: true, // agents
    assistant_id: true, // assistants, azureAssistants
    append_current_datetime: true, // 현재 날짜 시간 포함 여부

    /**
     * @endpoints: assistants, azureAssistants
     * 해당 실행(run)에만 적용되는 assistant 지침
     */
    instructions: true,
  })
  .merge(
    z.object({
      /** 사용할 엔드포인트 (전체 모델에 적용) */
      endpoint: extendedModelEndpointSchema.nullable(),
    }),
  );

// 프리셋 타입 정의
export type TPreset = z.infer<typeof tPresetSchema>;

// 옵션 설정 타입 정의: 파라미터 이름에 따라 새 값을 설정하는 함수
export type TSetOption = (
  param: number | string,
) => (newValue: number | string | boolean | string[] | Partial<TPreset>) => void;

// 대화 타입 정의: 기존 대화 스키마 + 프리셋 오버라이드 및 파라미터 비활성화 여부
export type TConversation = z.infer<typeof tConversationSchema> & {
  presetOverride?: Partial<TPreset>; // 프리셋 오버라이드
  disableParams?: boolean; // 파라미터 비활성화 여부
};

// 공유 링크 스키마 정의
export const tSharedLinkSchema = z.object({
  conversationId: z.string(), // 공유되는 대화 ID
  shareId: z.string(), // 공유 ID
  messages: z.array(z.string()), // 메시지 배열
  isPublic: z.boolean(), // 공개 여부
  title: z.string(), // 공유 제목
  createdAt: z.string(), // 생성 시간
  updatedAt: z.string(), // 수정 시간
});

// 공유 링크 타입 정의: tSharedLinkSchema로부터 타입 추론
export type TSharedLink = z.infer<typeof tSharedLinkSchema>;

// 대화 태그 스키마 정의
export const tConversationTagSchema = z.object({
  _id: z.string(),              // 태그의 고유 ID
  user: z.string(),             // 사용자 ID
  tag: z.string(),              // 태그 이름
  description: z.string().optional(), // 설명 (선택 항목)
  createdAt: z.string(),        // 생성일
  updatedAt: z.string(),        // 수정일
  count: z.number(),            // 이 태그가 사용된 횟수
  position: z.number(),         // 정렬 순서 또는 위치
});
// 위 스키마의 타입 정의
export type TConversationTag = z.infer<typeof tConversationTagSchema>;

// 구글 기반 스키마: tConversationSchema에서 특정 필드만 선택하여 정의
export const googleBaseSchema = tConversationSchema.pick({
  model: true,
  modelLabel: true,
  promptPrefix: true,
  examples: true,
  temperature: true,
  maxOutputTokens: true,
  artifacts: true,
  topP: true,
  topK: true,
  iconURL: true,
  greeting: true,
  spec: true,
  maxContextTokens: true,
});

// null, undefined 값을 제거하는 전처리 + 예외 처리 포함한 최종 구글 스키마
export const googleSchema = googleBaseSchema
  .transform((obj: Partial<TConversation>) => removeNullishValues(obj))
  .catch(() => ({}));

/**
 * Google 생성 설정 스키마
 * TODO: 다음 필드를 변환 매핑해야 함:
 *  - presence_penalty -> presencePenalty
 *  - frequency_penalty -> frequencyPenalty
 *  - stop -> stopSequences
 */
export const googleGenConfigSchema = z
  .object({
    maxOutputTokens: coerceNumber.optional(), // 최대 출력 토큰 수
    temperature: coerceNumber.optional(),     // 창의성 수치
    topP: coerceNumber.optional(),            // 확률 기반 필터링 (Top-P)
    topK: coerceNumber.optional(),            // 확률 기반 필터링 (Top-K)
    presencePenalty: coerceNumber.optional(), // 중복 방지 (Presence Penalty)
    frequencyPenalty: coerceNumber.optional(),// 반복 방지 (Frequency Penalty)
    stopSequences: z.array(z.string()).optional(), // 텍스트 생성을 중단할 시퀀스
  })
  .strip()    // 정의되지 않은 필드는 제거
  .optional(); // 전체 필드를 선택적(optional)로 처리

// GPT 플러그인 전용 기본 스키마 정의
const gptPluginsBaseSchema = tConversationSchema.pick({
  model: true,
  modelLabel: true,
  chatGptLabel: true,
  promptPrefix: true,
  temperature: true,
  artifacts: true,
  top_p: true,
  presence_penalty: true,
  frequency_penalty: true,
  tools: true,
  agentOptions: true,
  iconURL: true,
  greeting: true,
  spec: true,
  maxContextTokens: true,
});

// GPT 플러그인 설정을 위한 스키마
export const gptPluginsSchema = gptPluginsBaseSchema
  .transform((obj) => {
    const result = {
      ...obj,
      model: obj.model ?? 'gpt-3.5-turbo', // 기본 모델 지정
      chatGptLabel: obj.chatGptLabel ?? obj.modelLabel ?? null, // 라벨 설정
      promptPrefix: obj.promptPrefix ?? null,
      temperature: obj.temperature ?? 0.8,
      top_p: obj.top_p ?? 1,
      presence_penalty: obj.presence_penalty ?? 0,
      frequency_penalty: obj.frequency_penalty ?? 0,
      tools: obj.tools ?? [],
      agentOptions: obj.agentOptions ?? {
        agent: EAgent.functions,     // 기본 에이전트 설정
        skipCompletion: true,
        model: 'gpt-3.5-turbo',
        temperature: 0,
      },
      iconURL: obj.iconURL ?? undefined,
      greeting: obj.greeting ?? undefined,
      spec: obj.spec ?? undefined,
      maxContextTokens: obj.maxContextTokens ?? undefined,
    };

    // modelLabel이 비어 있지 않으면 null로 재설정
    if (obj.modelLabel != null && obj.modelLabel !== '') {
      result.modelLabel = null;
    }

    return result;
  })
  .catch(() => ({
    // 변환 실패 시 기본값 반환
    model: 'gpt-3.5-turbo',
    chatGptLabel: null,
    promptPrefix: null,
    temperature: 0.8,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    tools: [],
    agentOptions: {
      agent: EAgent.functions,
      skipCompletion: true,
      model: 'gpt-3.5-turbo',
      temperature: 0,
    },
    iconURL: undefined,
    greeting: undefined,
    spec: undefined,
    maxContextTokens: undefined,
  }));

// null 또는 undefined 값을 가진 속성 제거 함수
export function removeNullishValues<T extends Record<string, unknown>>(
  obj: T,
  removeEmptyStrings?: boolean,
): Partial<T> {
  const newObj: Partial<T> = { ...obj };

  (Object.keys(newObj) as Array<keyof T>).forEach((key) => {
    const value = newObj[key];
    if (value === undefined || value === null) {
      delete newObj[key]; // nullish 값 제거
    }
    if (removeEmptyStrings && typeof value === 'string' && value === '') {
      delete newObj[key]; // 빈 문자열 제거 (옵션)
    }
  });

  return newObj;
}

// Assistant 전용 설정을 위한 기본 스키마 정의
const assistantBaseSchema = tConversationSchema.pick({
  model: true,                      // 사용할 모델
  assistant_id: true,              // 어시스턴트 ID
  instructions: true,              // 실행 시 사용할 지시사항
  artifacts: true,
  promptPrefix: true,
  iconURL: true,
  greeting: true,
  spec: true,
  append_current_datetime: true,   // 현재 날짜/시간을 메시지에 추가할지 여부
});

// Assistant 스키마 정의: assistantBaseSchema 기반 + 누락된 필드에 기본값 설정
export const assistantSchema = assistantBaseSchema
  .transform((obj) => ({
    ...obj,
    model: obj.model ?? openAISettings.model.default, // 모델이 없으면 기본 모델 사용
    assistant_id: obj.assistant_id ?? undefined, // assistant ID가 없으면 undefined
    instructions: obj.instructions ?? undefined, // 지침이 없으면 undefined
    promptPrefix: obj.promptPrefix ?? null, // prefix가 없으면 null
    iconURL: obj.iconURL ?? undefined,
    greeting: obj.greeting ?? undefined,
    spec: obj.spec ?? undefined,
    append_current_datetime: obj.append_current_datetime ?? false, // 기본값 false
  }))
  .catch(() => ({
    // transform 실패 시 기본값 세팅
    model: openAISettings.model.default,
    assistant_id: undefined,
    instructions: undefined,
    promptPrefix: null,
    iconURL: undefined,
    greeting: undefined,
    spec: undefined,
    append_current_datetime: false,
  }));

// Compact Assistant 스키마: 기본 assistant 스키마에서 일부 필드만 선택
const compactAssistantBaseSchema = tConversationSchema.pick({
  model: true,
  assistant_id: true,
  instructions: true,
  promptPrefix: true,
  artifacts: true,
  iconURL: true,
  greeting: true,
  spec: true,
});

// compact 스키마에 null/undefined 필드를 제거하는 transform 적용
export const compactAssistantSchema = compactAssistantBaseSchema
  .transform((obj) => removeNullishValues(obj)) // null, undefined 필드 제거
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환

// Agent 전용 설정용 기본 스키마 정의
export const agentsBaseSchema = tConversationSchema.pick({
  model: true,
  modelLabel: true,
  temperature: true,
  top_p: true,
  presence_penalty: true,
  frequency_penalty: true,
  resendFiles: true,
  imageDetail: true,
  agent_id: true,
  instructions: true,
  promptPrefix: true,
  iconURL: true,
  greeting: true,
  maxContextTokens: true,
});

// Agents 스키마 정의: 기본값 적용 및 transform 처리 포함
export const agentsSchema = agentsBaseSchema
  .transform((obj) => ({
    ...obj,
    model: obj.model ?? agentsSettings.model.default, // 기본 모델 지정
    modelLabel: obj.modelLabel ?? null, // 라벨이 없으면 null
    temperature: obj.temperature ?? 1,
    top_p: obj.top_p ?? 1,
    presence_penalty: obj.presence_penalty ?? 0,
    frequency_penalty: obj.frequency_penalty ?? 0,
    resendFiles:
      typeof obj.resendFiles === 'boolean' ? obj.resendFiles : agentsSettings.resendFiles.default, // 기본 resendFiles 적용
    imageDetail: obj.imageDetail ?? ImageDetail.auto, // 이미지 디테일 기본값
    agent_id: obj.agent_id ?? undefined,
    instructions: obj.instructions ?? undefined,
    promptPrefix: obj.promptPrefix ?? null,
    iconURL: obj.iconURL ?? undefined,
    greeting: obj.greeting ?? undefined,
    maxContextTokens: obj.maxContextTokens ?? undefined,
  }))
  .catch(() => ({
    // 실패 시 fallback 기본값
    model: agentsSettings.model.default,
    modelLabel: null,
    temperature: 1,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    resendFiles: agentsSettings.resendFiles.default,
    imageDetail: ImageDetail.auto,
    agent_id: undefined,
    instructions: undefined,
    promptPrefix: null,
    iconURL: undefined,
    greeting: undefined,
    maxContextTokens: undefined,
  }));

// OpenAI 전용 기본 스키마: OpenAI 관련 설정 필드만 선택
export const openAIBaseSchema = tConversationSchema.pick({
  model: true,                  // 모델 이름
  modelLabel: true,             // 모델 라벨
  chatGptLabel: true,           // ChatGPT 라벨
  promptPrefix: true,           // 사용자 지침(prefix)
  temperature: true,            // 창의성 설정
  top_p: true,                  // Top-P 샘플링
  presence_penalty: true,       // 새로운 단어 유도
  frequency_penalty: true,      // 반복 억제
  resendFiles: true,            // 파일 재전송 여부
  artifacts: true,              // 출력 생성물
  imageDetail: true,            // 이미지 디테일 설정
  stop: true,                   // 중단 시퀀스
  iconURL: true,                // 아이콘 이미지
  greeting: true,               // 시작 인사말
  spec: true,                   // 사양 정보
  maxContextTokens: true,       // 최대 컨텍스트 토큰 수
  max_tokens: true,             // 응답 최대 토큰 수
  reasoning_effort: true,       // 추론 강도 (예: Claude 등에서 사용 가능)
});

// OpenAI용 설정 스키마: null 또는 undefined인 필드를 제거
export const openAISchema = openAIBaseSchema
  .transform((obj: Partial<TConversation>) => removeNullishValues(obj)) // nullish 값 제거
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환

// Google용 컴팩트 스키마: 기본값과 동일한 항목 제거 후 nullish 값 제거
export const compactGoogleSchema = googleBaseSchema
  .transform((obj) => {
    const newObj: Partial<TConversation> = { ...obj };

    // 기본값과 같은 경우 제거 (불필요한 데이터 제거 목적)
    if (newObj.temperature === google.temperature.default) {
      delete newObj.temperature;
    }
    if (newObj.maxOutputTokens === google.maxOutputTokens.default) {
      delete newObj.maxOutputTokens;
    }
    if (newObj.topP === google.topP.default) {
      delete newObj.topP;
    }
    if (newObj.topK === google.topK.default) {
      delete newObj.topK;
    }

    return removeNullishValues(newObj); // null/undefined 제거
  })
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환

// Anthropic 모델 설정용 기본 스키마
export const anthropicBaseSchema = tConversationSchema.pick({
  model: true,
  modelLabel: true,
  promptPrefix: true,
  temperature: true,
  maxOutputTokens: true,
  topP: true,
  topK: true,
  resendFiles: true,
  promptCache: true,
  thinking: true,
  thinkingBudget: true,
  artifacts: true,
  iconURL: true,
  greeting: true,
  spec: true,
  maxContextTokens: true,
});

// Anthropic용 최종 스키마: nullish 값 제거
export const anthropicSchema = anthropicBaseSchema
  .transform((obj) => removeNullishValues(obj))
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환

// GPT 플러그인 설정용 컴팩트 스키마
export const compactPluginsSchema = gptPluginsBaseSchema
  .transform((obj) => {
    const newObj: Partial<TConversation> = { ...obj };

    // null이거나 기본값과 같은 항목 제거
    if (newObj.modelLabel === null) {
      delete newObj.modelLabel;
    }
    if (newObj.chatGptLabel === null) {
      delete newObj.chatGptLabel;
    }
    if (newObj.promptPrefix === null) {
      delete newObj.promptPrefix;
    }
    if (newObj.temperature === 0.8) {
      delete newObj.temperature;
    }
    if (newObj.top_p === 1) {
      delete newObj.top_p;
    }
    if (newObj.presence_penalty === 0) {
      delete newObj.presence_penalty;
    }
    if (newObj.frequency_penalty === 0) {
      delete newObj.frequency_penalty;
    }
    if (newObj.tools?.length === 0) {
      delete newObj.tools;
    }

    // agentOptions가 기본값과 일치하면 제거
    if (
      newObj.agentOptions &&
      newObj.agentOptions.agent === EAgent.functions &&
      newObj.agentOptions.skipCompletion === true &&
      newObj.agentOptions.model === 'gpt-3.5-turbo' &&
      newObj.agentOptions.temperature === 0
    ) {
      delete newObj.agentOptions;
    }

    return removeNullishValues(newObj); // null/undefined 제거
  })
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환

// 배너 데이터 스키마 정의
export const tBannerSchema = z.object({
  bannerId: z.string(),      // 배너 ID
  message: z.string(),       // 배너 메시지
  displayFrom: z.string(),   // 표시 시작 시간
  displayTo: z.string(),     // 표시 종료 시간
  createdAt: z.string(),     // 생성 시간
  updatedAt: z.string(),     // 수정 시간
  isPublic: z.boolean(),     // 공개 여부
});
// 위 스키마를 기반으로 한 타입 추론
export type TBanner = z.infer<typeof tBannerSchema>;

// Agent 설정을 위한 간단한(base) 스키마
export const compactAgentsBaseSchema = tConversationSchema.pick({
  spec: true,                      // 대화 사양
  // model: true,                  // 모델은 주석 처리됨
  iconURL: true,                   // 아이콘 이미지 URL
  greeting: true,                  // 시작 인사말
  agent_id: true,                  // agent ID
  instructions: true,              // 지시 사항
  additional_instructions: true,  // 추가 지시 사항
});

// Compact Agents 스키마: null/undefined 제거
export const compactAgentsSchema = compactAgentsBaseSchema
  .transform((obj) => removeNullishValues(obj))
  .catch(() => ({})); // 오류 발생 시 빈 객체 반환
