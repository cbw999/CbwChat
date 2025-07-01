import { Schema, Document, Types } from 'mongoose';

// 잔액(Balance) 도큐먼트 타입 정의
export interface IBalance extends Document {
  user: Types.ObjectId; // 사용자(User) 참조
  tokenCredits: number; // 토큰 크레딧(잔액)
  // 자동 충전 설정
  autoRefillEnabled: boolean; // 자동 충전 활성화 여부
  refillIntervalValue: number; // 충전 주기 값
  refillIntervalUnit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'; // 충전 주기 단위
  lastRefill: Date; // 마지막 충전 시각
  refillAmount: number; // 한 번에 충전되는 양
}

// 잔액(Balance) 스키마 정의
const balanceSchema = new Schema<IBalance>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // User 컬렉션 참조
    index: true, // 인덱스 생성
    required: true, // 필수
  },
  // 1000 tokenCredits = 1 mill ($0.001 USD)
  tokenCredits: {
    type: Number,
    default: 0, // 기본값 0
  },
  // 자동 충전 설정
  autoRefillEnabled: {
    type: Boolean,
    default: false, // 기본값 false
  },
  refillIntervalValue: {
    type: Number,
    default: 30, // 기본값 30
  },
  refillIntervalUnit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'], // 허용 단위
    default: 'days', // 기본값 days
  },
  lastRefill: {
    type: Date,
    default: Date.now, // 기본값: 현재 시각
  },
  // 한 번에 충전되는 양
  refillAmount: {
    type: Number,
    default: 0, // 기본값 0
  },
});

export default balanceSchema;
