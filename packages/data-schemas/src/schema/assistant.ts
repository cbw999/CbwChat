import { Schema, Document, Types } from 'mongoose';

// 어시스턴트(Assistant) 도큐먼트 타입 정의
export interface IAssistant extends Document {
  user: Types.ObjectId; // 사용자(User) 참조
  assistant_id: string; // 어시스턴트 고유 ID
  avatar?: {
    filepath: string; // 아바타 파일 경로
    source: string;   // 아바타 소스
  };
  conversation_starters?: string[]; // 대화 시작 문장
  access_level?: number; // 접근 레벨
  file_ids?: string[]; // 파일 ID 목록
  actions?: string[]; // 사용 가능한 액션 목록
  append_current_datetime?: boolean; // 현재 날짜/시간 추가 여부
}

// 어시스턴트 스키마 정의
const assistantSchema = new Schema<IAssistant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // User 컬렉션 참조
      required: true, // 필수
    },
    assistant_id: {
      type: String,
      index: true, // 인덱스 생성
      required: true, // 필수
    },
    avatar: {
      type: Schema.Types.Mixed, // 아바타 정보(객체)
      default: undefined,
    },
    conversation_starters: {
      type: [String], // 대화 시작 문장 배열
      default: [],
    },
    access_level: {
      type: Number, // 접근 레벨
    },
    file_ids: {
      type: [String], // 파일 ID 목록
      default: undefined,
    },
    actions: {
      type: [String], // 액션 목록
      default: undefined,
    },
    append_current_datetime: {
      type: Boolean, // 현재 날짜/시간 추가 여부
      default: false,
    },
  },
  {
    timestamps: true, // 생성/수정 시간 자동 기록
  },
);

export default assistantSchema;
