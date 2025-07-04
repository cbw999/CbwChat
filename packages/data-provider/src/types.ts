import type OpenAI from 'openai';
import type { InfiniteData } from '@tanstack/react-query';
import type {
  TMessage,
  TResPlugin,
  ImageDetail,
  TSharedLink,
  TConversation,
  EModelEndpoint,
  TConversationTag,
  TBanner,
} from './schemas';
import { SettingDefinition } from './generate';

// 🔹 OpenAI 메시지 타입: OpenAI Chat API에서 사용하는 메시지 포맷
export type TOpenAIMessage = OpenAI.Chat.ChatCompletionMessageParam;

// 🔹 './schemas' 파일에서 모든 타입과 모듈을 재내보내기
export * from './schemas';

// 🔹 TMessage 배열을 나타내는 메시지 리스트 타입
export type TMessages = TMessage[];

/* TODO: EndpointOption 타입 정리 필요 */
export type TEndpointOption = {
    spec?: string | null;                    // 사양 또는 모델 명세
    iconURL?: string | null;                // 아이콘 이미지 URL
    endpoint: EModelEndpoint;              // 사용할 모델 엔드포인트 (필수)
    endpointType?: EModelEndpoint;         // 엔드포인트 유형 (예: openai, google 등)
    modelDisplayLabel?: string;            // 모델 표시용 라벨
    resendFiles?: boolean;                 // 파일 재전송 여부
    promptCache?: boolean;                 // 프롬프트 캐싱 여부
    maxContextTokens?: number;            // 최대 컨텍스트 토큰 수
    imageDetail?: ImageDetail;            // 이미지 디테일 옵션 (OpenAI 이미지 관련)
    model?: string | null;                 // 실제 사용할 모델 이름
    promptPrefix?: string;                // 대화 시작 시 사용할 프롬프트
    temperature?: number;                 // 응답 다양성 조절 값
    chatGptLabel?: string | null;         // ChatGPT 라벨
    modelLabel?: string | null;           // 모델 이름 라벨
    jailbreak?: boolean;                  // 제약 해제 여부 (예: 검열 우회 등)
    key?: string | null;                  // API 키 또는 인증 키
    /* assistant 관련 설정 */
    thread_id?: string;                   // Assistant API의 스레드 ID
    /* 다중 응답 스트림 관련 설정 */
    overrideConvoId?: string;             // 대화 ID를 강제로 지정
    overrideUserMessageId?: string;       // 사용자 메시지 ID를 강제로 지정
  };
  
  // 🔹 일시적으로 사용하는 Agent 기능 설정
export type TEphemeralAgent = {
    mcp?: string[];               // MCP(Multi Control Process) 관련 설정
    web_search?: boolean;         // 웹 검색 기능 사용 여부
    execute_code?: boolean;       // 코드 실행 기능 사용 여부
  };
  
  // 🔹 프롬프트 전송 시 사용하는 페이로드 타입
  export type TPayload = Partial<TMessage> & // 메시지 정보 (부분적으로만 필수)
    Partial<TEndpointOption> & {             // 엔드포인트 옵션 (부분적으로만 필수)
      isContinued: boolean;                  // 이전 대화 이어쓰기 여부
      conversationId: string | null;         // 연결된 대화 ID
      messages?: TMessages;                  // 전체 메시지 배열
      isTemporary: boolean;                  // 임시 대화 여부
      ephemeralAgent?: TEphemeralAgent | null; // 임시 Agent 기능 설정
    };
  
  // 🔹 사용자의 대화 전송에 필요한 모든 정보
  export type TSubmission = {
    artifacts?: string;                  // 생성된 아티팩트 (파일, 이미지 등)
    plugin?: TResPlugin;                 // 단일 플러그인 사용 정보
    plugins?: TResPlugin[];             // 다중 플러그인 정보
    userMessage: TMessage;              // 사용자가 입력한 메시지
    isEdited?: boolean;                 // 메시지가 편집된 것인지 여부
    isContinued?: boolean;              // 대화 이어쓰기 여부
    isTemporary: boolean;               // 임시 대화 여부
    messages: TMessage[];               // 전체 메시지 내역
    isRegenerate?: boolean;            // 응답 재생성 여부
    isResubmission?: boolean;          // 다시 제출한 요청인지 여부
    initialResponse?: TMessage;        // 이전 응답 메시지 (있는 경우)
    conversation: Partial<TConversation>; // 대화 객체 (부분적으로만 필요)
    endpointOption: TEndpointOption;   // 사용된 엔드포인트 옵션
    clientTimestamp?: string;          // 클라이언트 전송 시각
    ephemeralAgent?: TEphemeralAgent | null; // 임시 Agent 설정
  };
  
  // 🔹 초기 응답이 필수인 이벤트 제출 타입 (initialResponse 제외 후 다시 포함)
  export type EventSubmission = Omit<TSubmission, 'initialResponse'> & {
    initialResponse: TMessage;
  };
  
  // 🔹 플러그인 설치/제거 요청 정보
  export type TPluginAction = {
    pluginKey: string;                  // 플러그인 식별 키
    action: 'install' | 'uninstall';   // 설치 또는 제거
    auth?: Partial<Record<string, string>>; // 인증 정보
    isEntityTool?: boolean;            // 엔티티 기반 도구인지 여부
  };
  
  // 🔹 키-대화 배열 구조 (카테고리별 그룹핑된 대화 목록)
  export type GroupedConversations = [key: string, TConversation[]][];
  
  // 🔹 사용자 플러그인 설정 업데이트 요청
  export type TUpdateUserPlugins = {
    isEntityTool?: boolean; // 엔티티 기반 도구인지 여부
    pluginKey: string;      // 플러그인 키
    action: string;         // 액션 (예: install, uninstall, update 등)
    auth?: Partial<Record<string, string | null>>; // 인증 정보
  };
  
  // 🔹 대화 분류 (카테고리)
  export type TCategory = {
    id?: string;    // 고유 ID
    value: string;  // 카테고리 값
    label: string;  // 표시 라벨 (추후 다국어 키로 변경 예정)
  };
  
  // 🔹 에러 정보 포맷
  export type TError = {
    message: string;       // 에러 메시지
    code?: number | string; // 에러 코드
    response?: {
      data?: {
        message?: string; // 서버 응답 메시지
      };
      status?: number;    // HTTP 상태 코드
    };
  };
  
  // 🔹 2단계 인증 백업 코드
  export type TBackupCode = {
    codeHash: string;       // 해시된 코드
    used: boolean;          // 사용 여부
    usedAt: Date | null;    // 사용 시각
  };
  
  // 🔹 사용자 정보
  export type TUser = {
    id: string;             // 사용자 ID
    username: string;       // 사용자 이름
    email: string;          // 이메일 주소
    name: string;           // 이름
    avatar: string;         // 아바타 이미지 URL
    role: string;           // 사용자 권한 (예: admin, user)
    provider: string;       // 로그인 제공자 (예: google, github 등)
    plugins?: string[];     // 사용 중인 플러그인 목록
    twoFactorEnabled?: boolean; // 2단계 인증 활성화 여부
    backupCodes?: TBackupCode[]; // 백업 코드 목록
    createdAt: string;      // 생성일
    updatedAt: string;      // 수정일
  };
  
  // 🔹 대화 목록 조회 응답 구조
  export type TGetConversationsResponse = {
    conversations: TConversation[]; // 대화 배열
    pageNumber: string;             // 현재 페이지 번호
    pageSize: string | number;      // 페이지당 항목 수
    pages: string | number;         // 전체 페이지 수
  };
  
  // 🔹 메시지 업데이트 요청 (텍스트/모델 변경)
  export type TUpdateMessageRequest = {
    conversationId: string; // 대화 ID
    messageId: string;      // 메시지 ID
    model: string;          // 사용할 모델
    text: string;           // 새로운 메시지 내용
  };
  
  // 🔹 메시지 내용의 일부(index)를 업데이트하는 요청
  export type TUpdateMessageContent = {
    conversationId: string; // 대화 ID
    messageId: string;      // 메시지 ID
    index: number;          // 수정할 메시지 인덱스
    text: string;           // 새 텍스트
  };
  
  // 🔹 사용자 API 키 갱신 요청
  export type TUpdateUserKeyRequest = {
    name: string;       // 키 이름
    value: string;      // 키 값
    expiresAt: string;  // 만료 시각 (ISO 포맷)
  };
  
  // 🔹 대화 제목 수정 요청
  export type TUpdateConversationRequest = {
    conversationId: string; // 대상 대화 ID
    title: string;          // 새 제목
  };
  
  // 🔹 대화 업데이트 응답 타입 (업데이트된 대화 전체 반환)
export type TUpdateConversationResponse = TConversation;

// 🔹 대화 삭제 요청에 사용되는 타입
export type TDeleteConversationRequest = {
  conversationId?: string; // 삭제할 대화 ID
  thread_id?: string;      // 스레드 ID (Assistant용)
  endpoint?: string;       // 사용한 엔드포인트
  source?: string;         // 요청 출처
};

// 🔹 대화 삭제 결과 응답 타입
export type TDeleteConversationResponse = {
  acknowledged: boolean;  // 요청 처리 여부
  deletedCount: number;   // 삭제된 대화 수
  messages: {
    acknowledged: boolean;    // 메시지 삭제 처리 여부
    deletedCount: number;     // 삭제된 메시지 수
  };
};

// 🔹 대화 보관 요청 (isArchived = true/false)
export type TArchiveConversationRequest = {
  conversationId: string;  // 대상 대화 ID
  isArchived: boolean;     // 보관 여부
};

// 🔹 대화 보관 응답 (업데이트된 대화 반환)
export type TArchiveConversationResponse = TConversation;

// 공유 메시지 응답: 메시지 배열만 따로 포함된 형태
export type TSharedMessagesResponse = Omit<TSharedLink, 'messages'> & {
    messages: TMessage[]; // 공유된 메시지 배열
};

// 공유 링크 생성 요청 (대화 ID만 필요)
export type TCreateShareLinkRequest = Pick<TConversation, 'conversationId'>;

// 공유 링크 업데이트 요청 (shareId만 필요)
export type TUpdateShareLinkRequest = Pick<TSharedLink, 'shareId'>;

// 공유 링크 생성 또는 조회 응답 (shareId + conversationId 포함)
export type TSharedLinkResponse = Pick<TSharedLink, 'shareId'> &
    Pick<TConversation, 'conversationId'>;

// 공유 링크 조회 응답 + 성공 여부
export type TSharedLinkGetResponse = TSharedLinkResponse & {
    success: boolean;
};
  
// 대화 태그 조회 응답 (태그 목록)
export type TConversationTagsResponse = TConversationTag[];

// 태그 생성 요청
export type TConversationTagRequest = Partial<
  Omit<TConversationTag, 'createdAt' | 'updatedAt' | 'count' | 'user'>
> & {
  conversationId?: string;         // 태그를 추가할 대화 ID
  addToConversation?: boolean;     // 대화에 즉시 태그 추가 여부
};

// 태그 생성 응답
export type TConversationTagResponse = TConversationTag;

// 기존 태그를 대화에 적용하는 요청
export type TTagConversationRequest = {
  tags: string[]; // 전체 태그 목록
  tag: string;    // 적용할 태그 이름
};

// 태그 적용 응답 (적용된 태그 리스트)
export type TTagConversationResponse = string[];

// 대화 복제 요청 (대화 ID만 필요)
export type TDuplicateConvoRequest = {
    conversationId?: string;
};

// 대화 복제 응답 (새 대화 + 메시지 목록 포함)
export type TDuplicateConvoResponse = {
    conversation: TConversation;
    messages: TMessage[];
};

// 대화 포크(분기) 요청
export type TForkConvoRequest = {
    messageId: string;         // 기준 메시지 ID
    conversationId: string;    // 원본 대화 ID
    option?: string;           // 분기 옵션 (선택사항)
    splitAtTarget?: boolean;   // 지정 지점에서 분리 여부
    latestMessageId?: string;  // 최신 메시지 ID (선택사항)
};

// 대화 포크 응답
export type TForkConvoResponse = {
    conversation: TConversation;
    messages: TMessage[];
};
  
export type TSearchResults = {
    conversations: TConversation[];     // 검색된 대화 목록
    messages: TMessage[];               // 검색된 메시지 목록
    pageNumber: string;                 // 현재 페이지
    pageSize: string | number;          // 페이지당 항목 수
    pages: string | number;             // 전체 페이지 수
    filter: object;                     // 적용된 필터 정보
  };
  
  export type TConfig = {
    order: number;                        // 표시 순서
    type?: EModelEndpoint;               // 엔드포인트 타입 (예: openai, azure 등)
    azure?: boolean;                     // Azure 전용인지 여부
    availableTools?: [];                 // 사용 가능한 도구 목록
    availableRegions?: string[];         // 사용 가능한 지역
    plugins?: Record<string, string>;    // 플러그인 설정
    name?: string;                       // 엔드포인트 이름
    iconURL?: string;                    // 아이콘 URL
    version?: string;                    // 모델 버전
    modelDisplayLabel?: string;          // 모델 표시 이름
    userProvide?: boolean | null;        // 사용자가 직접 키를 제공하는지 여부
    userProvideURL?: boolean | null;     // 사용자가 URL 제공 가능한지 여부
    disableBuilder?: boolean;            // UI 빌더 비활성화 여부
    retrievalModels?: string[];          // 검색 기반 모델들
    capabilities?: string[];             // 지원 기능들
    customParams?: {
      defaultParamsEndpoint?: string;    // 기본 파라미터 API 엔드포인트
      paramDefinitions?: SettingDefinition[]; // 파라미터 정의 목록
    };
  };
  
  // 엔드포인트 설정 집합 (엔드포인트별 설정)
  export type TEndpointsConfig =
    | Record<EModelEndpoint | string, TConfig | null | undefined>
    | undefined;
  
  // 모델 이름별 설정된 모델 목록
  export type TModelsConfig = Record<string, string[]>;
  
  export type TUpdateTokenCountResponse = {
    count: number; // 사용된 토큰 수
  };

export type TMessageTreeNode = object;
export type TSearchMessage = object;
export type TSearchMessageTreeNode = object;

// 회원가입 응답
export type TRegisterUserResponse = {
    message: string;
  };
  
  // 회원가입 요청
  export type TRegisterUser = {
    name: string;
    email: string;
    username: string;
    password: string;
    confirm_password?: string;
    token?: string; // 가입 확인용 토큰
  };
  
  // 로그인 요청
  export type TLoginUser = {
    email: string;
    password: string;
    token?: string;
    backupCode?: string; // 2FA 백업 코드 (선택)
  };
  
  // 로그인 응답
  export type TLoginResponse = {
    token?: string;       // 인증 토큰
    user?: TUser;         // 사용자 정보
    twoFAPending?: boolean; // 2단계 인증 대기 상태
    tempToken?: string;   // 임시 토큰 (2FA용)
  };
  
  // 2FA 활성화 응답
export type TEnable2FAResponse = {
    otpauthUrl: string;     // OTP 인증 URL (앱에서 스캔용)
    backupCodes: string[];  // 백업 코드 목록
    message?: string;
  };
  
  // 2FA 인증 요청
  export type TVerify2FARequest = {
    token?: string;         // OTP 코드
    backupCode?: string;    // 백업 코드
  };
  
  // 2FA 인증 응답
  export type TVerify2FAResponse = {
    message: string;
  };
  
  // 로그인 중 임시 토큰으로 2FA 인증
  export type TVerify2FATempRequest = {
    tempToken: string;
    token?: string;
    backupCode?: string;
  };
  
  // 임시 토큰 2FA 인증 응답
  export type TVerify2FATempResponse = {
    token?: string;
    user?: TUser;
    message?: string;
  };
  
  // 2FA 비활성화 응답
  export type TDisable2FAResponse = {
    message: string;
  };
  
  // 백업 코드 재생성 응답
  export type TRegenerateBackupCodesResponse = {
    message: string;
    backupCodes: string[];       // 새 백업 코드
    backupCodesHash: string[];   // 해시된 코드
  };
  
  // 비밀번호 재설정 요청 (이메일 기반)
export type TRequestPasswordReset = {
    email: string;
  };
  
  // 비밀번호 재설정 요청 본문
  export type TResetPassword = {
    userId: string;
    token: string;
    password: string;
    confirm_password?: string;
  };
  
  // 이메일 인증 응답
  export type VerifyEmailResponse = { message: string };
  
  // 이메일 인증 요청
  export type TVerifyEmail = {
    email: string;
    token: string;
  };
  
  // 이메일 인증 재전송 요청 타입 (token을 제외한 TVerifyEmail 타입)
export type TResendVerificationEmail = Omit<TVerifyEmail, 'token'>;

// 토큰 재발급 응답 타입
export type TRefreshTokenResponse = {
  token: string; // 새로 발급된 토큰
  user: TUser;   // 사용자 정보
};

// 사용자 키 확인 응답 타입
export type TCheckUserKeyResponse = {
  expiresAt: string; // 키 만료 시간
};

// 비밀번호 재설정 요청 응답 타입
export type TRequestPasswordResetResponse = {
  link?: string;     // 비밀번호 재설정 링크 (옵션)
  message?: string;  // 응답 메시지 (옵션)
};

/**
 * Represents the response from the import endpoint.
 * import 엔드포인트로부터의 응답을 나타냅니다.
 */
export type TImportResponse = {
  /**
   * The message associated with the response.
   * 응답에 관련된 메시지입니다.
   */
  message: string;
};

/** 프롬프트 관련 타입들 */

// 프롬프트 타입 정의
export type TPrompt = {
  groupId: string;              // 속한 그룹 ID
  author: string;               // 작성자 ID
  prompt: string;               // 프롬프트 내용
  type: 'text' | 'chat';        // 프롬프트 유형
  createdAt: string;            // 생성일
  updatedAt: string;            // 수정일
  _id?: string;                 // 프롬프트 고유 ID (옵션)
};

// 프롬프트 그룹 정의
export type TPromptGroup = {
  name: string;                             // 그룹 이름
  numberOfGenerations?: number;            // 생성 횟수 (옵션)
  command?: string;                         // 커맨드 (옵션)
  oneliner?: string;                        // 간단한 설명 (옵션)
  category?: string;                        // 카테고리 (옵션)
  projectIds?: string[];                    // 관련 프로젝트 ID 리스트 (옵션)
  productionId?: string | null;             // 프로덕션 ID (옵션)
  productionPrompt?: Pick<TPrompt, 'prompt'> | null; // 프로덕션용 프롬프트 (옵션)
  author: string;                           // 작성자 ID
  authorName: string;                       // 작성자 이름
  createdAt?: Date;                         // 생성일 (옵션)
  updatedAt?: Date;                         // 수정일 (옵션)
  _id?: string;                             // 고유 ID (옵션)
};

// 프롬프트 생성 요청 타입
export type TCreatePrompt = {
  prompt: Pick<TPrompt, 'prompt' | 'type'> & { groupId?: string }; // 프롬프트 정보
  group?: { name: string; category?: string; oneliner?: string; command?: string }; // 그룹 정보 (옵션)
};

// 프롬프트 + 작성자 정보 포함 생성 요청
export type TCreatePromptRecord = TCreatePrompt & Pick<TPromptGroup, 'author' | 'authorName'>;

// 필터와 함께 프롬프트 목록 요청
export type TPromptsWithFilterRequest = {
  groupId: string;           // 그룹 ID
  tags?: string[];           // 태그 목록 (옵션)
  projectId?: string;        // 프로젝트 ID (옵션)
  version?: number;          // 버전 번호 (옵션)
};

// 필터와 함께 프롬프트 그룹 목록 요청
export type TPromptGroupsWithFilterRequest = {
  category: string;              // 카테고리
  pageNumber: string;           // 페이지 번호
  pageSize: string | number;    // 페이지 크기
  before?: string | null;       // 이전 커서 (옵션)
  after?: string | null;        // 다음 커서 (옵션)
  order?: 'asc' | 'desc';       // 정렬 순서 (옵션)
  name?: string;                // 그룹 이름 필터 (옵션)
  author?: string;              // 작성자 필터 (옵션)
};

// 프롬프트 그룹 목록 응답
export type PromptGroupListResponse = {
  promptGroups: TPromptGroup[];     // 프롬프트 그룹 리스트
  pageNumber: string;               // 현재 페이지 번호
  pageSize: string | number;        // 페이지 크기
  pages: string | number;           // 전체 페이지 수
};

export type PromptGroupListData = InfiniteData<PromptGroupListResponse>; // 무한 스크롤용 응답

// 프롬프트 생성 응답
export type TCreatePromptResponse = {
  prompt: TPrompt;
  group?: TPromptGroup;
};

// 프롬프트 그룹 수정 요청 페이로드
export type TUpdatePromptGroupPayload = Partial<TPromptGroup> & {
  removeProjectIds?: string[]; // 제거할 프로젝트 ID 목록 (옵션)
};

// 프롬프트 그룹 수정 요청 변수
export type TUpdatePromptGroupVariables = {
  id: string;                         // 수정 대상 그룹 ID
  payload: TUpdatePromptGroupPayload; // 수정 내용
};

// 프롬프트 그룹 수정 응답
export type TUpdatePromptGroupResponse = TPromptGroup;

// 프롬프트 삭제 응답
export type TDeletePromptResponse = {
  prompt: string; // 삭제된 프롬프트 내용
  promptGroup?: { message: string; id: string }; // 그룹 관련 메시지 (옵션)
};

// 프롬프트 삭제 요청 변수
export type TDeletePromptVariables = {
  _id: string;    // 프롬프트 ID
  groupId: string; // 그룹 ID
};

// 프롬프트를 프로덕션으로 지정한 경우의 응답
export type TMakePromptProductionResponse = {
  message: string; // 결과 메시지
};

// 프롬프트를 프로덕션으로 만들기 위한 요청
export type TMakePromptProductionRequest = {
  id: string; // 프롬프트 ID
  groupId: string; // 그룹 ID
  productionPrompt: Pick<TPrompt, 'prompt'>; // 프로덕션 프롬프트 내용
};

// 프롬프트 라벨 업데이트 요청
export type TUpdatePromptLabelsRequest = {
  id: string;
  payload: {
    labels: string[]; // 새로운 라벨 리스트
  };
};

// 프롬프트 라벨 업데이트 응답
export type TUpdatePromptLabelsResponse = {
  message: string; // 결과 메시지
};

// 프롬프트 그룹 삭제 응답
export type TDeletePromptGroupResponse = TUpdatePromptLabelsResponse;

// 프롬프트 그룹 삭제 요청
export type TDeletePromptGroupRequest = {
  id: string; // 삭제할 그룹 ID
};

// 카테고리 목록 응답
export type TGetCategoriesResponse = TCategory[];

// 랜덤 프롬프트 그룹 응답
export type TGetRandomPromptsResponse = {
  prompts: TPromptGroup[];
};

// 랜덤 프롬프트 그룹 요청
export type TGetRandomPromptsRequest = {
  limit: number; // 가져올 수
  skip: number;  // 건너뛸 수
};

// 사용자 맞춤 설정 (음성)
export type TCustomConfigSpeechResponse = { [key: string]: string };

// 사용자 약관 동의 여부 응답
export type TUserTermsResponse = {
  termsAccepted: boolean; // 약관 동의 여부
};

// 약관 동의 처리 응답
export type TAcceptTermsResponse = {
  success: boolean; // 성공 여부
};

// 배너 응답
export type TBannerResponse = TBanner | null;

// 사용자 잔액 관련 응답
export type TBalanceResponse = {
  tokenCredits: number;  // 사용 가능한 토큰 크레딧
  autoRefillEnabled: boolean;  // 자동 충전 활성화 여부
  refillIntervalValue?: number; // 충전 간격 값 (옵션)
  refillIntervalUnit?: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'; // 충전 간격 단위 (옵션)
  lastRefill?: Date;            // 마지막 충전 시각 (옵션)
  refillAmount?: number;        // 충전 금액 (옵션)
};
