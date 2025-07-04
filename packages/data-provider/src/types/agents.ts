/* eslint-disable @typescript-eslint/no-namespace */
// 필요한 열거형 및 타입 불러오기
import { StepTypes, ContentTypes, ToolCallTypes } from './runs';
import type { FunctionToolCall } from './assistants';
import type { TAttachment } from 'src/schemas';

// 에이전트 관련 타입을 정의하는 네임스페이스
export namespace Agents {
  // 메시지 타입 정의
  export type MessageType = 'human' | 'ai' | 'generic' | 'system' | 'function' | 'tool' | 'remove';

  // 이미지 디테일 수준 정의
  export type ImageDetail = 'auto' | 'low' | 'high';

  // 사고(Reasoning) 텍스트 콘텐츠 타입
  export type ReasoningContentText = {
    type: ContentTypes.THINK;
    think: string;
  };

  // 일반 메시지 텍스트 콘텐츠 타입
  export type MessageContentText = {
    type: ContentTypes.TEXT;
    text: string;
    tool_call_ids?: string[]; // 관련된 도구 호출 ID 목록
  };

  // 에이전트 업데이트 정보를 담는 콘텐츠 타입
  export type AgentUpdate = {
    type: ContentTypes.AGENT_UPDATE;
    agent_update: {
      index: number;
      runId: string;
      agentId: string;
    };
  };

  // 이미지 URL 형태의 콘텐츠 타입
  export type MessageContentImageUrl = {
    type: ContentTypes.IMAGE_URL;
    image_url: string | { url: string; detail?: ImageDetail };
  };

  // 복합 메시지 콘텐츠 타입
  export type MessageContentComplex =
    | ReasoningContentText
    | AgentUpdate
    | MessageContentText
    | MessageContentImageUrl
    | (Record<string, any> & { type?: ContentTypes | string }) // 기타 사용자 정의 콘텐츠
    | (Record<string, any> & { type?: never });

  // 메시지 콘텐츠는 문자열 또는 복합 콘텐츠 배열로 구성됨
  export type MessageContent = string | MessageContentComplex[];

  /**
   * 도구 호출 정보를 나타내는 타입
   */
  export type ToolCall = {
    type: ToolCallTypes.TOOL_CALL; // 도구 호출 타입
    name: string; // 호출할 도구 이름
    args?: string | Record<string, any>; // 도구 호출에 전달할 인자
    id?: string; // 도구 호출 식별자
    output?: string; // 도구 호출 결과
    auth?: string; // 인증 URL
    expires_at?: number; // 만료 시간
  };

  // 도구 호출이 완료되었을 때의 이벤트 타입
  export type ToolEndEvent = {
    id: string; // 단계 ID
    tool_call?: ToolCall; // 호출된 도구 정보
    index: number; // 콘텐츠 순서
  };

  // 콘텐츠 내 도구 호출 정보
  export type ToolCallContent = {
    type: ContentTypes.TOOL_CALL;
    tool_call?: ToolCall;
  };

  /**
   * 도구 호출의 일부 청크 정보를 나타냄 (스트리밍 상황 등)
   */
  export type ToolCallChunk = {
    name?: string; // 도구 이름 일부
    args?: string; // 인자 JSON 일부
    id?: string; // 도구 호출 ID 일부
    index?: number; // 호출 순서
    type?: 'tool_call_chunk'; // 타입
  };

  /**
   * 실행 가능한 컴포넌트의 이벤트 이름 정의
   * 예: on_tool_start, on_chain_end 등
   */
  export type EventName = string;

  // 실행 단계 정보
  export type RunStep = {
    type: StepTypes;
    id: string;
    runId?: string;
    index: number;
    stepIndex?: number;
    stepDetails: StepDetails;
    usage: null | object; // 자원 사용 정보
  };

  /**
   * 실행 단계의 변경(delta) 이벤트
   */
  export interface RunStepDeltaEvent {
    id: string; // 단계 ID
    delta: ToolCallDelta; // 변경된 필드 정보
  }

  // 실행 단계 세부 정보 (메시지 생성 or 도구 호출)
  export type StepDetails = MessageCreationDetails | ToolCallsDetails;

  // 메시지 생성 단계 세부 정보
  export type MessageCreationDetails = {
    type: StepTypes.MESSAGE_CREATION;
    message_creation: {
      message_id: string;
    };
  };

  // 도구 호출 단계 세부 정보
  export type ToolCallsDetails = {
    type: StepTypes.TOOL_CALLS;
    tool_calls: AgentToolCall[]; // 호출된 도구 목록
  };

  // 도구 호출 델타 정보
  export type ToolCallDelta = {
    type: StepTypes.TOOL_CALLS | string;
    tool_calls?: ToolCallChunk[];
    auth?: string;
    expires_at?: number;
  };

  // 함수 기반 도구 호출 또는 일반 도구 호출
  export type AgentToolCall = FunctionToolCall | ToolCall;

  // 확장된 메시지 콘텐츠 구조
  export interface ExtendedMessageContent {
    type?: string;
    text?: string;
    input?: string;
    index?: number;
    id?: string;
    name?: string;
  }

  /**
   * 메시지 델타 이벤트 (스트리밍 중 변경된 메시지 정보)
   */
  export interface MessageDeltaEvent {
    id: string;
    delta: MessageDelta;
  }

  // 메시지의 변경된 필드 내용
  export interface MessageDelta {
    content?: Agents.MessageContentComplex[];
  }

  /**
   * 사고(Reasoning) 델타 이벤트
   */
  export interface ReasoningDeltaEvent {
    id: string;
    delta: ReasoningDelta;
  }

  // 사고(Reasoning)의 변경된 필드 내용
  export interface ReasoningDelta {
    content?: MessageContentComplex[];
  }

  // 사고 콘텐츠 업데이트
  export type ReasoningDeltaUpdate = { type: ContentTypes.THINK; think: string };

  // 콘텐츠 타입 명시
  export type ContentType =
    | ContentTypes.THINK
    | ContentTypes.TEXT
    | ContentTypes.IMAGE_URL
    | string;
}

// 도구 호출 결과 타입 정의
export type ToolCallResult = {
  user: string; // 사용자 ID
  toolId: string; // 도구 ID
  result?: unknown; // 호출 결과
  messageId: string; // 관련 메시지 ID
  partIndex?: number; // 메시지 내 파트 인덱스
  blockIndex?: number; // 블록 인덱스
  conversationId: string; // 대화 ID
  attachments?: TAttachment[]; // 첨부 파일
};
