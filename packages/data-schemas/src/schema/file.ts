import mongoose, { Schema, Document, Types } from 'mongoose';
import { FileSources } from 'cbwchat-data-provider';

// MongoDB에 저장되는 파일 문서의 타입 정의
// @ts-ignore
export interface IMongoFile extends Document {
  user: Types.ObjectId;         // 파일을 업로드한 사용자 ID (User 참조)
  conversationId?: string;      // 연결된 대화 ID (Conversation 참조)
  file_id: string;              // 고유 파일 ID
  temp_file_id?: string;        // 임시 파일 ID (업로드 중 사용될 수 있음)
  bytes: number;                // 파일 크기 (바이트 단위)
  text?: string;                // 추출된 텍스트 (OCR 또는 문서 분석 결과 등)
  filename: string;             // 파일 이름
  filepath: string;             // 서버에 저장된 파일 경로
  object: 'file';               // 객체 타입 (고정값: 'file')
  embedded?: boolean;           // 파일이 임베디드 되었는지 여부
  type: string;                 // 파일 유형 (예: 'image/png', 'application/pdf' 등)
  context?: string;             // 문맥 정보 (사용 목적 등)
  usage: number;                // 사용 횟수 또는 사용량
  source: string;               // 파일 소스 (예: local, remote 등)
  model?: string;               // 관련된 AI 모델 정보
  width?: number;               // 이미지 너비 (이미지인 경우)
  height?: number;              // 이미지 높이 (이미지인 경우)
  metadata?: {
    fileIdentifier?: string;    // 추가 메타데이터 (파일 식별자 등)
  };
  expiresAt?: Date;             // 파일 만료 시간 (자동 삭제 시점)
  createdAt?: Date;             // 생성일 (자동 추가됨)
  updatedAt?: Date;             // 수정일 (자동 추가됨)
}

// 파일 스키마 정의
const file: Schema<IMongoFile> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',              // User 모델과 연결
      index: true,
      required: true,
    },
    conversationId: {
      type: String,
      ref: 'Conversation',      // Conversation 모델과 연결
      index: true,
    },
    file_id: {
      type: String,
      index: true,
      required: true,           // 필수 고유 파일 ID
    },
    temp_file_id: {
      type: String,             // 임시 파일 ID
    },
    bytes: {
      type: Number,
      required: true,           // 파일 크기
    },
    filename: {
      type: String,
      required: true,           // 원본 파일 이름
    },
    filepath: {
      type: String,
      required: true,           // 서버 내 저장 경로
    },
    object: {
      type: String,
      required: true,
      default: 'file',          // 고정 값: 'file'
    },
    embedded: {
      type: Boolean,            // 임베디드 여부
    },
    type: {
      type: String,
      required: true,           // MIME 타입 등
    },
    text: {
      type: String,             // 파일 내 텍스트 내용 (선택)
    },
    context: {
      type: String,             // 사용 문맥
    },
    usage: {
      type: Number,
      required: true,
      default: 0,               // 기본값: 0
    },
    source: {
      type: String,
      default: FileSources.local, // 기본 소스는 로컬
    },
    model: {
      type: String,             // 사용 모델 이름 (선택)
    },
    width: Number,              // 이미지 너비
    height: Number,             // 이미지 높이
    metadata: {
      fileIdentifier: String,   // 메타 정보: 식별자
    },
    expiresAt: {
      type: Date,
      expires: 3600,            // 만료 설정: 1시간 후 자동 삭제
    },
  },
  {
    timestamps: true,           // createdAt, updatedAt 자동 생성
  },
);

// 생성 및 수정일 기준 인덱스 추가
file.index({ createdAt: 1, updatedAt: 1 });

export default file;
