import { Schema, Document } from 'mongoose';

// 배너(Banner) 도큐먼트 타입 정의
export interface IBanner extends Document {
  bannerId: string;         // 배너 고유 ID
  message: string;          // 배너에 표시할 메시지
  displayFrom: Date;        // 배너 표시 시작 시각
  displayTo?: Date;         // 배너 표시 종료 시각(선택)
  type: 'banner' | 'popup'; // 배너 타입 (배너/팝업)
  isPublic: boolean;        // 공개 여부
}

// 배너(Banner) 스키마 정의
const bannerSchema = new Schema<IBanner>(
  {
    bannerId: {
      type: String,
      required: true, // 필수
    },
    message: {
      type: String,
      required: true, // 필수
    },
    displayFrom: {
      type: Date,
      required: true, // 필수
      default: Date.now, // 기본값: 현재 시각
    },
    displayTo: {
      type: Date, // 종료 시각(선택)
    },
    type: {
      type: String,
      enum: ['banner', 'popup'], // 허용 타입
      default: 'banner',         // 기본값: 배너
    },
    isPublic: {
      type: Boolean,
      default: false, // 기본값: 비공개
    },
  },
  { timestamps: true }, // 생성/수정 시간 자동 기록
);

export default bannerSchema;
