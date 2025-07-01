import { Schema, Document, Types } from 'mongoose';

// 에이전트(Agent) 도큐먼트 타입 정의
/* Omit<Document, 'model'>는 Document 타입에서 'model' 필드를 제외한 타입을 생성합니다.
   이는 mongoose Document의 기본 필드 중 'model'을 제외하고, 나머지 필드만 포함하는 타입을 의미합니다.
   이 방식은 mongoose에서 Document를 상속받아 커스텀 필드를 추가할 때 유용합니다.
*/
export interface IAgent extends Omit<Document, 'model'> {
  id: string; // 에이전트 고유 ID
  name?: string; // 에이전트 이름
  description?: string; // 설명
  instructions?: string; // 사용 지침
  avatar?: {
    filepath: string; // 아바타 파일 경로
    source: string;   // 아바타 소스
  };
  provider: string; // 제공자(플랫폼 등)
  model: string; // 사용 모델명
  model_parameters?: Record<string, unknown>; // 모델 파라미터
  artifacts?: string; // 산출물
  access_level?: number; // 접근 레벨
  recursion_limit?: number; // 재귀 제한
  tools?: string[]; // 사용 도구 목록
  tool_kwargs?: Array<unknown>; // 도구 옵션
  actions?: string[]; // 사용 가능한 액션 목록
  author: Types.ObjectId; // 작성자(User 참조)
  authorName?: string; // 작성자 이름
  hide_sequential_outputs?: boolean; // 연속 출력 숨김 여부
  end_after_tools?: boolean; // 도구 실행 후 종료 여부
  agent_ids?: string[]; // 관련 에이전트 ID 목록
  isCollaborative?: boolean; // 협업 여부
  conversation_starters?: string[]; // 대화 시작 문장
  tool_resources?: unknown; // 도구 리소스
  projectIds?: Types.ObjectId[]; // 프로젝트 ID 목록
  versions?: Omit<IAgent, 'versions'>[]; // 버전 정보
}

// 에이전트 스키마 정의
const agentSchema = new Schema<IAgent>(
  {
    id: {
      type: String,
      index: true,
      unique: true,
      required: true, // 고유 ID 필수
    },
    name: {
      type: String, // 이름
    },
    description: {
      type: String, // 설명
    },
    instructions: {
      type: String, // 사용 지침
    },
    avatar: {
      type: Schema.Types.Mixed, // 아바타 정보(객체)
      default: undefined,
    },
    provider: {
      type: String,
      required: true, // 제공자 필수
    },
    model: {
      type: String,
      required: true, // 모델명 필수
    },
    model_parameters: {
      type: Object, // 모델 파라미터
    },
    artifacts: {
      type: String, // 산출물
    },
    access_level: {
      type: Number, // 접근 레벨
    },
    recursion_limit: {
      type: Number, // 재귀 제한
    },
    tools: {
      type: [String], // 도구 목록
      default: undefined,
    },
    tool_kwargs: {
      type: [{ type: Schema.Types.Mixed }], // 도구 옵션
    },
    actions: {
      type: [String], // 액션 목록
      default: undefined,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User', // User 컬렉션 참조
      required: true, // 작성자 필수
    },
    authorName: {
      type: String, // 작성자 이름
      default: undefined,
    },
    hide_sequential_outputs: {
      type: Boolean, // 연속 출력 숨김 여부
    },
    end_after_tools: {
      type: Boolean, // 도구 실행 후 종료 여부
    },
    agent_ids: {
      type: [String], // 관련 에이전트 ID 목록
    },
    isCollaborative: {
      type: Boolean, // 협업 여부
      default: undefined,
    },
    conversation_starters: {
      type: [String], // 대화 시작 문장
      default: [],
    },
    tool_resources: {
      type: Schema.Types.Mixed, // 도구 리소스
      default: {},
    },
    projectIds: {
      type: [Schema.Types.ObjectId], // 프로젝트 ID 목록
      ref: 'Project',
      index: true,
    },
    versions: {
      type: [Schema.Types.Mixed], // 버전 정보
      default: [],
    },
  },
  {
    timestamps: true, // 생성/수정 시간 자동 기록
  },
);

export default agentSchema;
