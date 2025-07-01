import mongoose, { Schema, Document, Types } from 'mongoose';
import { conversationPreset } from './defaults';

// 대화(conversation) 문서의 타입 정의
// @ts-ignore
export interface IConversation extends Document {
  conversationId: string;       // 대화 고유 ID
  title?: string;               // 대화 제목
  user?: string;                // 사용자 ID
  messages?: Types.ObjectId[]; // 메시지 객체 ID 배열
  agentOptions?: unknown;      // 에이전트 설정 (형식 미정)

  // conversationPreset에서 가져온 필드들 (타입은 필요에 따라 조정 가능)
  endpoint?: string;           // 엔드포인트 종류 (예: openAI, azure 등)
  endpointType?: string;       // 엔드포인트 세부 타입
  model?: string;              // 사용 모델명
  region?: string;             // 리전 정보 (Bedrock 등용)
  chatGptLabel?: string;       // ChatGPT 라벨
  examples?: unknown[];        // 예시 (Google용 등)
  modelLabel?: string;         // 모델 라벨
  promptPrefix?: string;       // 프롬프트 앞부분 텍스트
  temperature?: number;        // 샘플링 온도
  top_p?: number;              // Top-p 샘플링
  topP?: number;               // Google용 TopP
  topK?: number;               // Top-k 샘플링
  maxOutputTokens?: number;    // 출력 토큰 최대값
  maxTokens?: number;          // 최대 토큰 수
  presence_penalty?: number;   // 참조되지 않은 토픽 유도 강도
  frequency_penalty?: number;  // 반복 억제 강도
  file_ids?: string[];         // 연결된 파일 ID
  resendImages?: boolean;      // 이미지 재전송 여부
  promptCache?: boolean;       // 프롬프트 캐시 여부 (Anthropic용)
  thinking?: boolean;          // '생각 중' 상태 여부
  thinkingBudget?: number;     // 생각 시간 설정
  system?: string;             // 시스템 메시지
  resendFiles?: boolean;       // 파일 재전송 여부
  imageDetail?: string;        // 이미지 세부 정보
  agent_id?: string;           // 에이전트 ID
  assistant_id?: string;       // 어시스턴트 ID
  instructions?: string;       // 사용자 지침
  stop?: string[];             // 정지 조건
  isArchived?: boolean;        // 보관 여부
  iconURL?: string;            // 아이콘 URL
  greeting?: string;           // 인사말
  spec?: string;               // 사양 정보
  tags?: string[];             // 태그 목록
  tools?: string[];            // 도구 목록
  maxContextTokens?: number;   // 최대 컨텍스트 토큰 수
  max_tokens?: number;         // 최대 토큰 수
  reasoning_effort?: string;   // 추론 노력 수준 (Omni 모델용)

  // 추가 필드
  files?: string[];            // 첨부된 파일 목록
  expiredAt?: Date;            // 만료일
  createdAt?: Date;            // 생성일 (자동 추가됨)
  updatedAt?: Date;            // 수정일 (자동 추가됨)
}

// 실제 Mongoose 스키마 정의
const convoSchema: Schema<IConversation> = new Schema(
  {
    conversationId: {
      type: String,
      unique: true,            // 고유값
      required: true,          // 필수 필드
      index: true,             // 인덱싱
      meiliIndex: true,        // Meilisearch 인덱싱
    },
    title: {
      type: String,
      default: 'New Chat',     // 기본값
      meiliIndex: true,        // Meilisearch 인덱싱
    },
    user: {
      type: String,
      index: true,             // 인덱싱
    },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }], // 메시지 참조
    agentOptions: {
      type: mongoose.Schema.Types.Mixed, // 다양한 타입 허용
    },
    // conversationPreset의 모든 필드를 펼쳐서 포함시킴
    ...conversationPreset,
    agent_id: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
      meiliIndex: true,        // Meilisearch 인덱싱
    },
    files: {
      type: [String],          // 첨부 파일
    },
    expiredAt: {
      type: Date,              // 만료 시간
    },
  },
  { timestamps: true },        // createdAt, updatedAt 자동 생성
);

// 인덱스 설정
convoSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 }); // 만료 처리 인덱스
convoSchema.index({ createdAt: 1, updatedAt: 1 });              // 날짜 기반 인덱스
convoSchema.index({ conversationId: 1, user: 1 }, { unique: true }); // 사용자별 대화 고유성

export default convoSchema;
