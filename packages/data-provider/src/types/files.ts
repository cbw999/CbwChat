import { EToolResources } from './assistants';

// 파일이 저장될 수 있는 출처(소스)를 정의한 열거형
export enum FileSources {
  local = 'local',             // 로컬 저장소
  firebase = 'firebase',       // Firebase
  azure = 'azure',             // Azure
  azure_blob = 'azure_blob',   // Azure Blob Storage
  openai = 'openai',           // OpenAI 저장소
  s3 = 's3',                   // AWS S3
  vectordb = 'vectordb',       // 벡터 데이터베이스
  execute_code = 'execute_code', // 코드 실행 시 생성된 파일
  mistral_ocr = 'mistral_ocr', // OCR 결과 파일
  text = 'text',               // 텍스트 기반 파일
}

// 파일 소스가 OpenAI 또는 Azure인지 확인하는 함수
export const checkOpenAIStorage = (source: string) =>
  source === FileSources.openai || source === FileSources.azure;

// 파일의 맥락(Context)을 정의하는 열거형
export enum FileContext {
  avatar = 'avatar',                     // 아바타 이미지
  unknown = 'unknown',                   // 알 수 없는 맥락
  agents = 'agents',                     // 에이전트 관련 파일
  assistants = 'assistants',             // 어시스턴트 관련
  execute_code = 'execute_code',         // 코드 실행 관련
  image_generation = 'image_generation', // 이미지 생성 결과
  assistants_output = 'assistants_output', // 어시스턴트 출력
  message_attachment = 'message_attachment', // 메시지에 첨부된 파일
  filename = 'filename',                 // 파일 이름
  updatedAt = 'updatedAt',               // 수정된 날짜
  source = 'source',                     // 파일 소스
  filterSource = 'filterSource',         // 필터된 파일 소스
  context = 'context',                   // 기타 맥락
  bytes = 'bytes',                       // 파일 크기
}

// 각 엔드포인트에 대한 파일 업로드 설정 타입
export type EndpointFileConfig = {
  disabled?: boolean;                 // 비활성화 여부
  fileLimit?: number;                // 업로드 가능한 파일 개수 제한
  fileSizeLimit?: number;            // 단일 파일 크기 제한
  totalSizeLimit?: number;           // 전체 업로드 크기 제한
  supportedMimeTypes?: RegExp[];     // 지원되는 MIME 타입 목록
};

// 전체 파일 설정 타입
export type FileConfig = {
  endpoints: {
    [key: string]: EndpointFileConfig; // 엔드포인트 별 설정
  };
  serverFileSizeLimit?: number;       // 서버가 허용하는 최대 파일 크기
  avatarSizeLimit?: number;           // 아바타 최대 크기
  checkType?: (fileType: string, supportedTypes: RegExp[]) => boolean; // MIME 타입 체크 함수
};

// 실제 파일 객체의 타입 정의
export type TFile = {
  _id?: string;
  __v?: number;
  user: string;                      // 사용자 ID
  conversationId?: string;          // 대화 ID
  message?: string;                 // 메시지 ID 또는 내용
  file_id: string;                  // 파일 ID
  temp_file_id?: string;            // 임시 파일 ID
  bytes: number;                    // 파일 크기 (바이트 단위)
  embedded: boolean;                // 임베드 여부
  filename: string;                 // 파일 이름
  filepath: string;                 // 파일 경로
  object: 'file';                   // 객체 타입 (항상 'file')
  type: string;                     // MIME 타입
  usage: number;                    // 사용 횟수 또는 용도
  context?: FileContext;           // 맥락
  source?: FileSources;            // 파일 소스
  filterSource?: FileSources;      // 필터링된 소스
  width?: number;                   // 이미지 너비 (해당하는 경우)
  height?: number;                  // 이미지 높이 (해당하는 경우)
  expiresAt?: string | Date;        // 만료 일시
  preview?: string;                 // 미리보기 URL
  metadata?: { fileIdentifier?: string }; // 메타데이터
  createdAt?: string | Date;        // 생성일
  updatedAt?: string | Date;        // 수정일
};

// 업로드 중인 파일 타입 (temp_file_id 필수 포함)
export type TFileUpload = TFile & {
  temp_file_id: string;
};

// 아바타 업로드 결과 응답 타입
export type AvatarUploadResponse = {
  url: string;
};

// 음성 인식(Speech to Text) 결과 응답 타입
export type SpeechToTextResponse = {
  text: string;
};

// 음성 응답 타입 (TTS 결과)
export type VoiceResponse = string[];

// 일반 파일 업로드 시 사용할 콜백 옵션들
export type UploadMutationOptions = {
  onSuccess?: (data: TFileUpload, variables: FormData, context?: unknown) => void;
  onMutate?: (variables: FormData) => void | Promise<unknown>;
  onError?: (error: unknown, variables: FormData, context?: unknown) => void;
};

// 아바타 업로드 전용 옵션
export type UploadAvatarOptions = {
  onSuccess?: (data: AvatarUploadResponse, variables: FormData, context?: unknown) => void;
  onMutate?: (variables: FormData) => void | Promise<unknown>;
  onError?: (error: unknown, variables: FormData, context?: unknown) => void;
};

// 음성 → 텍스트 변환 시 옵션
export type SpeechToTextOptions = {
  onSuccess?: (data: SpeechToTextResponse, variables: FormData, context?: unknown) => void;
  onMutate?: (variables: FormData) => void | Promise<unknown>;
  onError?: (error: unknown, variables: FormData, context?: unknown) => void;
};

// 텍스트 → 음성 변환 시 옵션
export type TextToSpeechOptions = {
  onSuccess?: (data: ArrayBuffer, variables: FormData, context?: unknown) => void;
  onMutate?: (variables: FormData) => void | Promise<unknown>;
  onError?: (error: unknown, variables: FormData, context?: unknown) => void;
};

// 음성 요청 처리 시 옵션
export type VoiceOptions = {
  onSuccess?: (data: VoiceResponse, variables: unknown, context?: unknown) => void;
  onMutate?: () => void | Promise<unknown>;
  onError?: (error: unknown, variables: unknown, context?: unknown) => void;
};

// 파일 삭제 응답 타입
export type DeleteFilesResponse = {
  message: string;                            // 응답 메시지
  result: Record<string, unknown>;            // 상세 결과
};

// 일괄 파일 삭제 요청에 사용되는 파일 정보
export type BatchFile = {
  file_id: string;       // 파일 ID
  filepath: string;      // 경로
  embedded: boolean;     // 임베디드 여부
  source: FileSources;   // 출처
  temp_file_id?: string; // 임시 ID
};

// 일괄 파일 삭제 요청 바디
export type DeleteFilesBody = {
  files: BatchFile[];              // 삭제할 파일 목록
  agent_id?: string;               // 에이전트 ID
  assistant_id?: string;          // 어시스턴트 ID
  tool_resource?: EToolResources; // 툴 리소스 타입
};

// 파일 삭제 요청 시 사용할 옵션
export type DeleteMutationOptions = {
  onSuccess?: (data: DeleteFilesResponse, variables: DeleteFilesBody, context?: unknown) => void;
  onMutate?: (variables: DeleteFilesBody) => void | Promise<unknown>;
  onError?: (error: unknown, variables: DeleteFilesBody, context?: unknown) => void;
};
