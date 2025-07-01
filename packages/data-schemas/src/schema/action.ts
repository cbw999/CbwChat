import mongoose, { Schema, Document } from 'mongoose';

// Action 도큐먼트 타입 정의
export interface IAction extends Document {
  user: mongoose.Types.ObjectId;  // 사용자 ID (ObjectId 타입)
  action_id: string;  // 액션 ID (문자열 타입)
  type: string;
  settings?: unknown;
  agent_id?: string;
  assistant_id?: string;
  metadata: {
    api_key?: string;
    auth: {
      authorization_type?: string;
      custom_auth_header?: string;
      type: 'service_http' | 'oauth' | 'none';
      authorization_content_type?: string;
      authorization_url?: string;
      client_url?: string;
      scope?: string;
      token_exchange_method: 'default_post' | 'basic_auth_header' | null;
    };
    domain: string;
    privacy_policy_url?: string;
    raw_spec?: string;
    oauth_client_id?: string;
    oauth_client_secret?: string;
  };
}

// 인증 관련 서브 스키마 정의 (_id 없이)
const AuthSchema = new Schema(
  {
    authorization_type: { type: String }, // 인증 타입
    custom_auth_header: { type: String }, // 커스텀 인증 헤더
    type: { type: String, enum: ['service_http', 'oauth', 'none'] }, // 인증 방식
    authorization_content_type: { type: String }, // 인증 컨텐츠 타입
    authorization_url: { type: String }, // 인증 URL
    client_url: { type: String }, // 클라이언트 URL
    scope: { type: String }, // 인증 범위
    token_exchange_method: { type: String, enum: ['default_post', 'basic_auth_header', null] }, // 토큰 교환 방식
  },
  { _id: false }, // _id 필드 생성 안 함
);

// Action 메인 스키마 정의
const Action = new Schema<IAction>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User 모델 참조
    index: true,
    required: true,
  },
  action_id: {
    type: String,
    index: true,
    required: true,
  },
  type: {
    type: String,
    default: 'action_prototype',
  },
  settings: Schema.Types.Mixed, // 임의의 설정값
  agent_id: String,
  assistant_id: String,
  metadata: {
    api_key: String,
    auth: AuthSchema, // 인증 서브 스키마
    domain: {
      type: String,
      required: true,
    },
    privacy_policy_url: String,
    raw_spec: String,
    oauth_client_id: String,
    oauth_client_secret: String,
  },
});

export default Action;
