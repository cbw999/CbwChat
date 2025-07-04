import type { OpenAPIV3 } from 'openapi-types';
import type { AssistantsEndpoint, AgentProvider } from 'src/schemas';
import type { ContentTypes } from './runs';
import type { Agents } from './agents';
import type { TFile } from './files';
import { ArtifactModes } from 'src/artifacts';

// OpenAPI 스키마에 설명(description)을 추가한 커스텀 타입
export type Schema = OpenAPIV3.SchemaObject & { description?: string };

// OpenAPI 참조 객체에 설명(description)을 추가한 커스텀 타입
export type Reference = OpenAPIV3.ReferenceObject & { description?: string };

// 어시스턴트나 에이전트에서 활용 가능한 메타데이터 객체 타입
export type Metadata = {
  avatar?: string;  // 사용자 아바타 이미지 URL
  author?: string;  // 작성자 이름
} & {
  [key: string]: unknown; // 추가적인 임의의 키-값 쌍 허용
};

// 어시스턴트가 사용할 수 있는 툴의 종류 정의
export enum Tools {
  execute_code = 'execute_code',        // 코드 실행기
  code_interpreter = 'code_interpreter',// 코드 인터프리터
  file_search = 'file_search',          // 파일 검색기
  web_search = 'web_search',            // 웹 검색기
  retrieval = 'retrieval',              // 정보 검색기
  function = 'function',                // 외부 함수 호출
}

// 각 툴에 연결된 리소스의 이름 정의 (agent에서 사용)
export enum EToolResources {
  code_interpreter = 'code_interpreter', // 코드 인터프리터 리소스
  execute_code = 'execute_code',         // 코드 실행 리소스
  file_search = 'file_search',           // 파일 검색 리소스
  image_edit = 'image_edit',             // 이미지 편집 리소스
  ocr = 'ocr',                           // OCR (문자 인식) 리소스
}

// 툴 타입 매핑 (사용자 정의 툴 타입 키 → 실제 툴 종류)
export type Tool = {
  [type: string]: Tools;
};

// Function 형식의 툴 정의 (OpenAI Function 호출을 위한 구조)
export type FunctionTool = {
  type: Tools;  // 툴 종류 ('function' 등)
  function?: {
    description: string;                     // 함수 설명
    name: string;                            // 함수 이름
    parameters: Record<string, unknown>;     // 함수 파라미터 정의
    strict?: boolean;                        // 엄격 모드 여부
    additionalProperties?: boolean;          // 엄격 모드일 경우 false여야 함 https://platform.openai.com/docs/guides/structured-outputs/some-type-specific-keywords-are-not-yet-supported
  };
};

// 어시스턴트가 사용하는 툴 리소스 정의 (툴마다 필요한 리소스 타입이 다름)
export interface ToolResources {
  code_interpreter?: CodeInterpreterResource; // 코드 인터프리터용 리소스
  file_search?: FileSearchResource;           // 파일 검색용 리소스
}

// 코드 인터프리터 리소스 정의 (사용할 파일 ID 리스트)
export interface CodeInterpreterResource {
  file_ids?: Array<string>; // 연결된 파일 ID 배열 (최대 20개)
}

// 파일 검색 툴에서 사용할 벡터 스토어 ID 리스트
export interface FileSearchResource {
  vector_store_ids?: Array<string>; // 연결된 벡터 스토어 ID 배열 (최대 1개)
}

// 어시스턴트의 전체 데이터 구조 정의
export type Assistant = {
  id: string;                              // 어시스턴트 고유 ID
  created_at: number;                      // 생성 시각 (timestamp)
  description: string | null;              // 어시스턴트 설명
  file_ids?: string[];                     // 연결된 파일 ID 목록
  instructions: string | null;             // 어시스턴트 지시 사항
  conversation_starters?: string[];        // 대화 시작 문구 추천
  metadata: Metadata | null;               // 사용자 정의 메타데이터
  model: string;                           // 사용 모델 (예: gpt-4)
  name: string | null;                     // 어시스턴트 이름
  object: string;                          // 객체 타입 ('assistant')
  tools?: FunctionTool[];                  // 어시스턴트에 연결된 툴들
  tool_resources?: ToolResources;          // 툴 리소스 정보
};

// 어시스턴트를 엔드포인트별로 맵핑한 자료구조
export type TAssistantsMap = Record<AssistantsEndpoint, Record<string, Assistant>>;

// 어시스턴트 생성 시 사용되는 요청 파라미터 정의
export type AssistantCreateParams = {
  model: string;                                  // 사용할 모델명
  description?: string | null;                    // 어시스턴트 설명
  file_ids?: string[];                            // 파일 ID 리스트
  instructions?: string | null;                   // 지시사항
  conversation_starters?: string[];               // 대화 시작 문장
  metadata?: Metadata | null;                     // 메타데이터
  name?: string | null;                           // 어시스턴트 이름
  tools?: Array<FunctionTool | string>;           // 툴 정의 또는 이름
  endpoint: AssistantsEndpoint;                   // 연결된 API 엔드포인트
  version: number | string;                       // 버전 정보
  append_current_datetime?: boolean;              // 현재 날짜 삽입 여부
};

// 어시스턴트 업데이트 시 사용되는 파라미터
export type AssistantUpdateParams = {
  model?: string;
  description?: string | null;
  file_ids?: string[];
  instructions?: string | null;
  conversation_starters?: string[] | null;
  metadata?: Metadata | null;
  name?: string | null;
  tools?: Array<FunctionTool | string>;
  tool_resources?: ToolResources;
  endpoint: AssistantsEndpoint;
  append_current_datetime?: boolean;
};

// 어시스턴트 목록을 조회할 때 사용하는 필터링 파라미터
export type AssistantListParams = {
  limit?: number;             // 최대 개수
  before?: string | null;     // 이전 페이지 기준 ID
  after?: string | null;      // 다음 페이지 기준 ID
  order?: 'asc' | 'desc';     // 정렬 순서
  endpoint: AssistantsEndpoint; // 대상 엔드포인트
};

// 어시스턴트 목록 응답 타입 정의
export type AssistantListResponse = {
  object: string;        // 객체 타입
  data: Assistant[];     // 어시스턴트 배열
  first_id: string;      // 첫 번째 어시스턴트 ID
  last_id: string;       // 마지막 어시스턴트 ID
  has_more: boolean;     // 더 많은 항목이 있는지 여부
};

// 파일 객체 정의 (어시스턴트, 튜닝 등에 사용)
export type File = {
  file_id: string;    // 파일 ID
  id?: string;
  temp_file_id?: string;
  bytes: number;      // 파일 크기
  created_at: number; // 생성 시간
  filename: string;   // 파일 이름
  object: string;     // 객체 타입
  purpose: 'fine-tune' | 'fine-tune-results' | 'assistants' | 'assistants_output'; // 사용 목적
};

/* Agent types */
// 에이전트 모델 파라미터 값 (숫자, 문자열 또는 null)
export type AgentParameterValue = number | string | null;

// 에이전트의 모델 파라미터 정의
export type AgentModelParameters = {
  model?: string;                   // 모델 이름 (예: gpt-4)
  temperature: AgentParameterValue;        // 창의성 조절
  maxContextTokens: AgentParameterValue;   // 최대 컨텍스트 토큰 (camelCase)
  max_context_tokens: AgentParameterValue; // 최대 컨텍스트 토큰 (snake_case)
  max_output_tokens: AgentParameterValue;  // 출력 토큰 제한
  top_p: AgentParameterValue;              // 확률 분포 샘플링
  frequency_penalty: AgentParameterValue;  // 반복 패널티
  presence_penalty: AgentParameterValue;   // 새로운 내용 생성 유도
};

// 툴 리소스의 기본 구조 (공통 요소 정의)
export interface AgentBaseResource {
  file_ids?: Array<string>; // 사용 가능한 파일 ID
  files?: Array<TFile>;     // 미리 불러온 파일 객체
}

// 에이전트별 툴 리소스 정의
export interface AgentToolResources {
  [EToolResources.image_edit]?: AgentBaseResource;       // 이미지 편집 리소스
  [EToolResources.execute_code]?: ExecuteCodeResource;   // 코드 실행 리소스
  [EToolResources.file_search]?: AgentFileResource;      // 파일 검색 리소스
  [EToolResources.ocr]?: AgentBaseResource;              // OCR 리소스
}

// 코드 실행 툴 전용 리소스
export type ExecuteCodeResource = AgentBaseResource;

// 파일 검색 리소스 정의 (벡터 스토어 포함)
export interface AgentFileResource extends AgentBaseResource {
  vector_store_ids?: Array<string>; // 연결된 벡터 스토어 ID
}

// 에이전트 객체 전체 정의
export type Agent = {
  id: string;                               // 에이전트 고유 ID
  name: string | null;                      // 에이전트 이름
  author?: string | null;                   // 작성자 ID
  endpoint?: string | null;                 // 사용자 지정 API 엔드포인트
  authorName?: string | null;               // 작성자 이름
  description: string | null;               // 설명
  created_at: number;                       // 생성 시각
  avatar: AgentAvatar | null;               // 에이전트 아바타
  instructions: string | null;              // 시스템 프롬프트
  additional_instructions?: string | null;  // 추가 지시사항
  tools?: string[];                         // 사용 가능한 툴 이름 리스트
  projectIds?: string[];                    // 연결된 프로젝트 ID들
  tool_kwargs?: Record<string, unknown>;    // 툴 실행 시 추가 옵션
  metadata?: Record<string, unknown>;       // 사용자 메타데이터
  provider: AgentProvider;                  // 모델 공급자
  model: string | null;                     // 모델 이름
  model_parameters: AgentModelParameters;   // 모델 설정
  conversation_starters?: string[];         // 대화 시작 예시
  isCollaborative?: boolean;                // 공동 작업 가능 여부
  tool_resources?: AgentToolResources;      // 툴 리소스
  agent_ids?: string[];                     // 하위 에이전트 ID
  end_after_tools?: boolean;                // 툴 실행 후 종료 여부
  hide_sequential_outputs?: boolean;        // 출력 병합 여부
  artifacts?: ArtifactModes;                // 출력 아티팩트 모드
  recursion_limit?: number;                 // 재귀 호출 제한
  version?: number;                         // 에이전트 버전
};

// 에이전트를 ID 기반으로 저장하는 맵
export type TAgentsMap = Record<string, Agent | undefined>;

// 에이전트를 생성할 때 사용하는 파라미터 타입
export type AgentCreateParams = {
  name?: string | null; // 에이전트 이름 (선택)
  description?: string | null; // 에이전트 설명 (선택)
  avatar?: AgentAvatar | null; // 에이전트 아바타 정보 (선택)
  file_ids?: string[]; // 에이전트에 연결된 파일 ID 목록
  instructions?: string | null; // 에이전트에게 주어질 지침
  tools?: Array<FunctionTool | string>; // 에이전트가 사용할 도구 목록
  provider: AgentProvider; // 사용하는 AI 제공자
  model: string | null; // 사용할 모델 이름
  model_parameters: AgentModelParameters; // 모델 파라미터 설정
} & Pick<
  Agent,
  // Agent 타입에서 일부 속성만 선택적으로 상속
  'agent_ids' | // 하위 에이전트들의 ID
  'end_after_tools' | // 도구 실행 이후 종료 여부
  'hide_sequential_outputs' | // 순차 출력 숨김 여부
  'artifacts' | // 생성된 아티팩트 설정
  'recursion_limit' // 재귀 호출 제한
>;

// 에이전트를 업데이트할 때 사용하는 파라미터 타입
export type AgentUpdateParams = {
  name?: string | null; // 이름 변경 (선택)
  description?: string | null; // 설명 변경 (선택)
  avatar?: AgentAvatar | null; // 아바타 변경 (선택)
  file_ids?: string[]; // 연결된 파일 목록 수정
  instructions?: string | null; // 지침 수정
  tools?: Array<FunctionTool | string>; // 도구 목록 수정
  tool_resources?: ToolResources; // 도구와 관련된 리소스
  provider?: AgentProvider; // AI 제공자 수정
  model?: string | null; // 모델 이름 수정
  model_parameters?: AgentModelParameters; // 모델 파라미터 수정
  projectIds?: string[]; // 연결할 프로젝트 ID 목록
  removeProjectIds?: string[]; // 연결 해제할 프로젝트 ID 목록
  isCollaborative?: boolean; // 협업 가능 여부
} & Pick<
  Agent,
  'agent_ids' |
  'end_after_tools' |
  'hide_sequential_outputs' |
  'artifacts' |
  'recursion_limit'
>;

// 에이전트 목록 조회 시 사용하는 파라미터
export type AgentListParams = {
  limit?: number; // 최대 조회 개수
  before?: string | null; // 이 ID 이전 항목들 조회
  after?: string | null; // 이 ID 이후 항목들 조회
  order?: 'asc' | 'desc'; // 정렬 순서
  provider?: AgentProvider; // 특정 제공자의 에이전트만 조회
};

// 에이전트 목록 조회 응답 타입
export type AgentListResponse = {
  object: string; // 응답 객체 타입 (예: 'list')
  data: Agent[]; // 에이전트 목록
  first_id: string; // 첫 번째 항목 ID
  last_id: string; // 마지막 항목 ID
  has_more: boolean; // 추가 데이터 존재 여부
};

// 에이전트와 연결된 파일 정보 타입
export type AgentFile = {
  file_id: string; // 파일 ID
  id?: string; // 내부 ID (선택)
  temp_file_id?: string; // 임시 파일 ID (선택)
  bytes: number; // 파일 크기 (byte 단위)
  created_at: number; // 생성 시간 (timestamp)
  filename: string; // 파일명
  object: string; // 객체 타입 (예: 'file')
  purpose: 'fine-tune' | 'fine-tune-results' | 'agents' | 'agents_output'; // 파일 용도
};

/**
 * 실행 단계(run step)에서 호출된 코드 인터프리터(Code Interpreter) 도구 호출에 대한 상세 정보.
 * 도구 호출 ID, 코드 인터프리터 정의, 도구 호출 타입을 포함함.
 */
export type CodeToolCall = {
  id: string; // 도구 호출의 ID
  code_interpreter: {
    input: string; // 코드 인터프리터에 전달된 입력 값
    outputs: Array<Record<string, unknown>>; // 코드 인터프리터로부터의 출력 결과 배열
  };
  type: 'code_interpreter'; // 도구 호출 타입, 항상 'code_interpreter'
};

/**
 * 실행 단계에서 호출된 함수(Function) 도구에 대한 상세 정보.
 * 도구 호출 ID, 함수 정의, 도구 호출 타입을 포함함.
 */
export type FunctionToolCall = {
  id: string; // 도구 호출 객체의 ID
  function: {
    arguments: string; // 함수에 전달된 인자 (JSON 문자열 형태)
    name: string; // 호출된 함수의 이름
    output: string | null; // 함수의 출력 값, 제출되지 않았을 경우 null
  };
  type: 'function'; // 도구 호출 타입, 항상 'function'
};

/**
 * 실행 단계에서 호출된 검색(Retrieval) 도구에 대한 상세 정보.
 * 도구 호출 ID 및 도구 호출 타입을 포함함.
 */
export type RetrievalToolCall = {
  id: string; // 도구 호출 객체의 ID
  retrieval: unknown; // 현재는 빈 객체로 처리됨
  type: 'retrieval'; // 도구 호출 타입, 항상 'retrieval'
};

/**
 * 실행 단계에서 호출된 파일 검색(File Search) 도구에 대한 상세 정보.
 * 도구 호출 ID 및 도구 호출 타입을 포함함.
 */
export type FileSearchToolCall = {
  id: string; // 도구 호출 객체의 ID
  file_search: unknown; // 현재는 빈 객체로 처리됨
  type: 'file_search'; // 도구 호출 타입, 항상 'file_search'
};

/**
 * 실행 단계에서 호출된 다양한 도구 호출 정보 집합.
 * 다음 도구 타입 중 하나 이상과 연관될 수 있음: `code_interpreter`, `retrieval`, `file_search`, `function`.
 */
export type ToolCallsStepDetails = {
  tool_calls: Array<CodeToolCall | RetrievalToolCall | FileSearchToolCall | FunctionToolCall>; // 실행 단계에서 호출된 도구들의 배열
  type: 'tool_calls'; // 타입은 항상 'tool_calls'
};

/**
 * 이미지 파일 정보를 포함하는 타입.
 * 메시지 콘텐츠에 포함된 이미지 파일에 대한 ID 및 메타데이터 정보를 가짐.
 */
export type ImageFile = TFile & {
  /**
   * 메시지 콘텐츠에 포함된 이미지의 파일 ID
   * 참고: https://platform.openai.com/docs/api-reference/files
   */
  file_id: string;
  filename: string; // 파일 이름
  filepath: string; // 파일 경로
  height: number; // 이미지 높이
  width: number; // 이미지 너비
  /**
   * (있는 경우) 이미지를 생성하는 데 사용된 프롬프트
   */
  prompt?: string;
  /**
   * 이미지나 도구 호출에 대한 추가 메타데이터
   */
  metadata?: Record<string, unknown>;
};

// FileCitation.ts

// 파일 인용 정보를 나타내는 타입
export type FileCitation = {
  end_index: number; // 인용 텍스트의 끝 인덱스
  file_citation: FileCitationDetails; // 인용 상세 정보
  start_index: number; // 인용 텍스트의 시작 인덱스
  text: string; // 인용된 원본 텍스트
  type: 'file_citation'; // 타입은 항상 'file_citation'
};

// 파일 인용의 세부 정보
export type FileCitationDetails = {
  file_id: string; // 인용된 파일의 ID
  quote: string; // 인용된 텍스트 문자열
};

// 파일 경로 정보를 나타내는 타입
export type FilePath = {
  end_index: number; // 경로 텍스트의 끝 인덱스
  file_path: FilePathDetails; // 파일 경로 상세 정보
  start_index: number; // 경로 텍스트의 시작 인덱스
  text: string; // 표시되는 경로 텍스트
  type: 'file_path'; // 타입은 항상 'file_path'
};

// 파일 경로의 세부 정보
export type FilePathDetails = {
  file_id: string; // 파일의 ID
};

// 텍스트 콘텐츠 타입 (주석 포함 가능)
export type Text = {
  annotations?: Array<FileCitation | FilePath>; // 텍스트에 포함된 파일 인용 또는 경로 주석
  value: string; // 텍스트 문자열 값
};

// 주석의 타입 정의 (파일 인용 또는 경로)
export enum AnnotationTypes {
  FILE_CITATION = 'file_citation',
  FILE_PATH = 'file_path',
}

// 단계 상태를 나타내는 열거형
export enum StepStatus {
  IN_PROGRESS = 'in_progress', // 실행 중
  CANCELLED = 'cancelled',     // 취소됨
  FAILED = 'failed',           // 실패함
  COMPLETED = 'completed',     // 완료됨
  EXPIRED = 'expired',         // 만료됨
}

// 메시지 콘텐츠 타입
export enum MessageContentTypes {
  TEXT = 'text',               // 텍스트 메시지
  IMAGE_FILE = 'image_file',   // 이미지 파일
}

// 실행 상태를 나타내는 열거형 (RunStatus)
// 실행의 전체 상태: 대기, 실행 중, 작업 필요, 취소 중, 취소됨, 실패, 완료, 만료됨
export enum RunStatus {
  QUEUED = 'queued',                 // 대기 중
  IN_PROGRESS = 'in_progress',      // 실행 중
  REQUIRES_ACTION = 'requires_action', // 추가 작업 필요
  CANCELLING = 'cancelling',        // 취소 중
  CANCELLED = 'cancelled',          // 취소됨
  FAILED = 'failed',                // 실패
  COMPLETED = 'completed',          // 완료됨
  EXPIRED = 'expired',              // 만료됨
}

// 콘텐츠 파트의 메타데이터
export type PartMetadata = {
  progress?: number;            // 처리 진행률 (0~100)
  asset_pointer?: string;       // 리소스 참조 포인터
  status?: string;              // 상태 정보
  action?: boolean;             // 사용자 작업 여부
  auth?: string;                // 인증 정보
  expires_at?: number;          // 만료 시각 (timestamp)
};

// 메시지의 콘텐츠 파트 (다양한 타입 조합 가능)
export type ContentPart = (
  | CodeToolCall               // 코드 인터프리터 호출
  | RetrievalToolCall          // 검색 도구 호출
  | FileSearchToolCall         // 파일 검색 도구 호출
  | FunctionToolCall           // 함수 도구 호출
  | Agents.AgentToolCall       // 에이전트 도구 호출
  | ImageFile                  // 이미지 파일
  | Text                       // 텍스트
) & PartMetadata;              // + 메타데이터

// 메시지 콘텐츠 타입들
export type TMessageContentParts =
  | { type: ContentTypes.ERROR; text?: string | (Text & PartMetadata); error?: string } // 오류 메시지
  | { type: ContentTypes.THINK; think: string | (Text & PartMetadata) }                 // 사고 중 텍스트
  | { type: ContentTypes.TEXT; text: string | (Text & PartMetadata); tool_call_ids?: string[] } // 일반 텍스트
  | {
      type: ContentTypes.TOOL_CALL; // 도구 호출
      tool_call: (
        | CodeToolCall
        | RetrievalToolCall
        | FileSearchToolCall
        | FunctionToolCall
        | Agents.AgentToolCall
      ) & PartMetadata;
    }
  | { type: ContentTypes.IMAGE_FILE; image_file: ImageFile & PartMetadata }             // 이미지 파일
  | Agents.AgentUpdate                                                                   // 에이전트 업데이트
  | Agents.MessageContentImageUrl;                                                       // 에이전트 이미지 URL

// 스트리밍 콘텐츠 데이터 (실시간 메시지 구성 요소)
export type StreamContentData = TMessageContentParts & {
  index: number;      // 현재 콘텐츠 파트의 인덱스
  edited?: boolean;   // 이전 콘텐츠가 편집되어 대체되었는지 여부
};

// 전체 콘텐츠 데이터 (스트리밍 포함 가능)
export type TContentData = StreamContentData & {
  messageId: string;        // 메시지 ID
  conversationId: string;   // 대화 ID
  userMessageId: string;    // 사용자 메시지 ID
  thread_id: string;        // 스레드 ID
  stream?: boolean;         // 스트리밍 여부
};

// 액션 관련 상수 정의
export const actionDelimiter = '_action_'; // 액션 구분자
export const actionDomainSeparator = '---'; // 도메인 구분자
export const hostImageIdSuffix = '_host_copy'; // 호스트 이미지 ID 접미사
export const hostImageNamePrefix = 'host_copy_'; // 호스트 이미지 이름 접두사

// 인증 방식 종류
export enum AuthTypeEnum {
  ServiceHttp = 'service_http', // 서비스 기반 HTTP 인증
  OAuth = 'oauth',              // OAuth 인증
  None = 'none',                // 인증 없음
}

// Authorization 헤더 방식
export enum AuthorizationTypeEnum {
  Bearer = 'bearer', // Bearer 토큰 방식
  Basic = 'basic',   // Basic 인증 방식
  Custom = 'custom', // 사용자 정의 인증 방식
}

// OAuth 토큰 교환 방식
export enum TokenExchangeMethodEnum {
  DefaultPost = 'default_post',         // 기본 POST 방식
  BasicAuthHeader = 'basic_auth_header' // Authorization 헤더에 클라이언트 정보 포함
}

// 액션 인증 정보를 담는 타입
export type ActionAuth = {
  authorization_type?: AuthorizationTypeEnum;   // 인증 유형 (Bearer, Basic 등)
  custom_auth_header?: string;                  // 사용자 정의 인증 헤더
  type?: AuthTypeEnum;                          // 인증 방식
  authorization_content_type?: string;          // 인증 요청의 콘텐츠 타입
  authorization_url?: string;                   // 인증 요청 URL
  client_url?: string;                          // 클라이언트 리디렉션 URL
  scope?: string;                               // OAuth 범위
  token_exchange_method?: TokenExchangeMethodEnum; // 토큰 교환 방식
};

// 액션의 메타데이터 정의
export type ActionMetadata = {
  api_key?: string;                  // API 키
  auth?: ActionAuth;                // 인증 정보
  domain?: string;                  // 도메인 정보
  privacy_policy_url?: string;      // 개인정보 보호정책 URL
  raw_spec?: string;                // 원시 스펙(JSON 등)
  oauth_client_id?: string;         // OAuth 클라이언트 ID
  oauth_client_secret?: string;     // OAuth 클라이언트 시크릿
};

// 런타임 시점에 사용되는 액션 메타데이터 확장
export type ActionMetadataRuntime = ActionMetadata & {
  oauth_access_token?: string;      // OAuth 액세스 토큰
  oauth_refresh_token?: string;     // OAuth 갱신 토큰
  oauth_token_expires_at?: Date;    // 액세스 토큰 만료 시각
};

/* Assistant 관련 타입 정의 */

// 액션 타입 정의
export type Action = {
  action_id: string;                        // 액션 ID
  type?: string;                            // 액션 타입 (예: HTTP 등)
  settings?: Record<string, unknown>;       // 사용자 정의 설정값
  metadata: ActionMetadata;                 // 액션 메타데이터
  version: number | string;                 // 버전
} & (
  | { assistant_id: string; agent_id?: never } // assistant_id가 있는 경우 (agent_id는 없음)
  | { assistant_id?: never; agent_id: string } // agent_id가 있는 경우 (assistant_id는 없음)
);

// 어시스턴트 아바타 정보
export type AssistantAvatar = {
  filepath: string; // 파일 경로
  source: string;   // 이미지 소스 경로
};

// 어시스턴트 문서 메타데이터
export type AssistantDocument = {
  user: string;                      // 생성자
  assistant_id: string;              // 어시스턴트 ID
  conversation_starters?: string[]; // 대화 시작 프롬프트들
  avatar?: AssistantAvatar;         // 아바타 정보
  access_level?: number;            // 접근 권한 레벨
  file_ids?: string[];              // 연결된 파일 ID들
  actions?: string[];               // 연결된 액션 ID들
  createdAt?: Date;                 // 생성일
  updatedAt?: Date;                 // 수정일
  append_current_datetime?: boolean; // 현재 날짜/시간 자동 추가 여부
};

/* Agent 관련 타입 정의 */

// 에이전트 아바타 정보
export type AgentAvatar = {
  filepath: string; // 파일 경로
  source: string;   // 이미지 소스 경로
};

// 파일의 용도를 정의하는 열거형(enum)
// 각 항목은 특정 목적에 따라 파일이 사용되는 방식입니다.
export enum FilePurpose {
  Vision = 'vision', // 비전(이미지 등) 관련 용도
  FineTune = 'fine-tune', // 파인튜닝에 사용되는 데이터 파일
  FineTuneResults = 'fine-tune-results', // 파인튜닝 결과 파일
  Assistants = 'assistants', // 어시스턴트 관련 구성 파일
  AssistantsOutput = 'assistants_output', // 어시스턴트 실행 결과 파일
}

// 기본 정렬 쿼리 설정
// 데이터를 내림차순으로 최대 100개까지 가져오도록 설정
export const defaultOrderQuery: {
  order: 'desc'; // 내림차순 정렬
  limit: 100;    // 최대 100개 제한
} = {
  order: 'desc',
  limit: 100,
};

// 어시스턴트 스트림 이벤트를 정의하는 열거형(enum)
// 어시스턴트 실행 흐름에서 발생할 수 있는 다양한 이벤트를 정의
export enum AssistantStreamEvents {
  ThreadCreated = 'thread.created', // 스레드가 생성됨
  ThreadRunCreated = 'thread.run.created', // 실행(run)이 생성됨
  ThreadRunQueued = 'thread.run.queued', // 실행이 큐에 대기 중
  ThreadRunInProgress = 'thread.run.in_progress', // 실행이 진행 중
  ThreadRunRequiresAction = 'thread.run.requires_action', // 실행 중 사용자 조치 필요
  ThreadRunCompleted = 'thread.run.completed', // 실행 완료
  ThreadRunFailed = 'thread.run.failed', // 실행 실패
  ThreadRunCancelling = 'thread.run.cancelling', // 실행 취소 중
  ThreadRunCancelled = 'thread.run.cancelled', // 실행 취소 완료
  ThreadRunExpired = 'thread.run.expired', // 실행 만료됨

  ThreadRunStepCreated = 'thread.run.step.created', // 실행 단계가 생성됨
  ThreadRunStepInProgress = 'thread.run.step.in_progress', // 실행 단계 진행 중
  ThreadRunStepCompleted = 'thread.run.step.completed', // 실행 단계 완료
  ThreadRunStepFailed = 'thread.run.step.failed', // 실행 단계 실패
  ThreadRunStepCancelled = 'thread.run.step.cancelled', // 실행 단계 취소됨
  ThreadRunStepExpired = 'thread.run.step.expired', // 실행 단계 만료됨
  ThreadRunStepDelta = 'thread.run.step.delta', // 실행 단계의 변화가 감지됨

  ThreadMessageCreated = 'thread.message.created', // 메시지가 생성됨
  ThreadMessageInProgress = 'thread.message.in_progress', // 메시지가 처리 중
  ThreadMessageCompleted = 'thread.message.completed', // 메시지 처리 완료
  ThreadMessageIncomplete = 'thread.message.incomplete', // 메시지가 불완전함
  ThreadMessageDelta = 'thread.message.delta', // 메시지에 변화가 있음

  ErrorEvent = 'error', // 오류 이벤트 발생
}
