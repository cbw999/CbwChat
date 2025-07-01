import { Schema, Document } from 'mongoose';

// 대화 태그(ConversationTag) 도큐먼트 타입 정의
export interface IConversationTag extends Document {
  tag?: string;         // 태그명
  user?: string;        // 사용자 ID 또는 이름
  description?: string; // 태그 설명
  count?: number;       // 태그 사용 횟수
  position?: number;    // 태그 정렬 순서
}

// 대화 태그(ConversationTag) 스키마 정의
const conversationTag = new Schema<IConversationTag>(
  {
    tag: {
      type: String,
      index: true, // 인덱스 생성
    },
    user: {
      type: String,
      index: true, // 인덱스 생성
    },
    description: {
      type: String,
      index: true, // 인덱스 생성
    },
    count: {
      type: Number,
      default: 0, // 기본값 0
    },
    position: {
      type: Number,
      default: 0, // 기본값 0
      index: true, // 인덱스 생성
    },
  },
  { timestamps: true }, // 생성/수정 시간 자동 기록
);

// tag와 user 조합에 대해 유니크 복합 인덱스 생성
conversationTag.index({ tag: 1, user: 1 }, { unique: true });

export default conversationTag;
