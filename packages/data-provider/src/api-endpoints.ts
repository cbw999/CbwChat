// API 엔드포인트 타입 정의를 가져옴
import type { AssistantsEndpoint } from './schemas';
import * as q from './types/queries';

// buildQuery 함수: 파라미터 객체를 URL 쿼리 문자열로 변환
const buildQuery = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => {
      // 값이 배열이면 비어있지 않은 경우만 필터링
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      // 값이 undefined, null, 빈 문자열이 아닌 경우만 필터링
      return value !== undefined && value !== null && value !== '';
    })
    .map(([key, value]) => {
      // 배열이면 각 값을 쿼리 문자열로 변환
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&');
      }
      // 일반 값도 URL 인코딩하여 변환
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .join('&');

  return query ? `?${query}` : '';
};

// 기본적인 상태 확인 엔드포인트
export const health = () => '/health';
export const user = () => '/api/user';
export const balance = () => '/api/balance';
export const userPlugins = () => '/api/user/plugins';
export const deleteUser = () => '/api/user/delete';

// 메시지 관련 API (조회 등)
export const messages = (params: q.MessagesListParams) => {
  const { conversationId, messageId, ...rest } = params;

  if (conversationId && messageId) {
    return `/api/messages/${conversationId}/${messageId}`;
  }

  if (conversationId) {
    return `/api/messages/${conversationId}`;
  }

  return `/api/messages${buildQuery(rest)}`;
};

// 공유 메시지 관련 엔드포인트
const shareRoot = '/api/share';
export const shareMessages = (shareId: string) => `${shareRoot}/${shareId}`;
export const getSharedLink = (conversationId: string) => `${shareRoot}/link/${conversationId}`;
export const getSharedLinks = (
  pageSize: number,
  isPublic: boolean,
  sortBy: 'title' | 'createdAt',
  sortDirection: 'asc' | 'desc',
  search?: string,
  cursor?: string,
) =>
  `${shareRoot}?pageSize=${pageSize}&isPublic=${isPublic}&sortBy=${sortBy}&sortDirection=${sortDirection}${
    search ? `&search=${search}` : ''
  }${cursor ? `&cursor=${cursor}` : ''}`;
export const createSharedLink = (conversationId: string) => `${shareRoot}/${conversationId}`;
export const updateSharedLink = (shareId: string) => `${shareRoot}/${shareId}`;

// 사용자 API 키 관련
const keysEndpoint = '/api/keys';
export const keys = () => keysEndpoint;
export const userKeyQuery = (name: string) => `${keysEndpoint}?name=${name}`;
export const revokeUserKey = (name: string) => `${keysEndpoint}/${name}`;
export const revokeAllUserKeys = () => `${keysEndpoint}?all=true`;

// 요청 중단
export const abortRequest = (endpoint: string) => `/api/ask/${endpoint}/abort`;

// 대화 관련
export const conversationsRoot = '/api/convos';
export const conversations = (params: q.ConversationListParams) => {
  return `${conversationsRoot}${buildQuery(params)}`;
};
export const conversationById = (id: string) => `${conversationsRoot}/${id}`;
export const genTitle = () => `${conversationsRoot}/gen_title`;
export const updateConversation = () => `${conversationsRoot}/update`;
export const deleteConversation = () => `${conversationsRoot}`;
export const deleteAllConversation = () => `${conversationsRoot}/all`;
export const importConversation = () => `${conversationsRoot}/import`;
export const forkConversation = () => `${conversationsRoot}/fork`;
export const duplicateConversation = () => `${conversationsRoot}/duplicate`;

// 검색 관련
export const search = (q: string, cursor?: string | null) =>
  `/api/search?q=${q}${cursor ? `&cursor=${cursor}` : ''}`;
export const searchEnabled = () => '/api/search/enable';

// 프리셋 관련
export const presets = () => '/api/presets';
export const deletePreset = () => '/api/presets/delete';

// AI 모델 및 엔드포인트 설정
export const aiEndpoints = () => '/api/endpoints';
export const endpointsConfigOverride = () => '/api/endpoints/config/override';
export const models = () => '/api/models';
export const tokenizer = () => '/api/tokenizer';

// 인증 및 로그인 관련
export const login = () => '/api/auth/login';
export const logout = () => '/api/auth/logout';
export const register = () => '/api/auth/register';
export const loginFacebook = () => '/api/auth/facebook';
export const loginGoogle = () => '/api/auth/google';
export const refreshToken = (retry?: boolean) =>
  `/api/auth/refresh${retry === true ? '?retry=true' : ''}`;
export const requestPasswordReset = () => '/api/auth/requestPasswordReset';
export const resetPassword = () => '/api/auth/resetPassword';

// 이메일 인증
export const verifyEmail = () => '/api/user/verify';
export const resendVerificationEmail = () => '/api/user/verify/resend';

// 플러그인 및 설정
export const plugins = () => '/api/plugins';
export const config = () => '/api/config';

// 프롬프트 관련
export const prompts = () => '/api/prompts';
export const getPromptGroup = (_id: string) => `${prompts()}/groups/${_id}`;
export const getPromptGroupsWithFilters = (filter: object) => {
  let url = `${prompts()}/groups`;
  if (Object.keys(filter).length > 0) {
    const queryParams = new URLSearchParams(filter as Record<string, string>).toString();
    url += `?${queryParams}`;
  }
  return url;
};
export const getPromptsWithFilters = (filter: object) => {
  let url = prompts();
  if (Object.keys(filter).length > 0) {
    const queryParams = new URLSearchParams(filter as Record<string, string>).toString();
    url += `?${queryParams}`;
  }
  return url;
};
export const getPrompt = (_id: string) => `${prompts()}/${_id}`;
export const getRandomPrompts = (limit: number, skip: number) =>
  `${prompts()}/random?limit=${limit}&skip=${skip}`;
export const postPrompt = prompts;
export const updatePromptGroup = getPromptGroup;
export const updatePromptLabels = (_id: string) => `${getPrompt(_id)}/labels`;
export const updatePromptTag = (_id: string) => `${getPrompt(_id)}/tags/production`;
export const deletePromptGroup = getPromptGroup;
export const deletePrompt = ({ _id, groupId }: { _id: string; groupId: string }) => {
  return `${prompts()}/${_id}?groupId=${groupId}`;
};

// 카테고리
export const getCategories = () => '/api/categories';
export const getAllPromptGroups = () => `${prompts()}/all`;

/* 역할(Role) 관련 API */
export const roles = () => '/api/roles';
export const getRole = (roleName: string) => `${roles()}/${roleName.toLowerCase()}`;
export const updatePromptPermissions = (roleName: string) => `${getRole(roleName)}/prompts`;
export const updateAgentPermissions = (roleName: string) => `${getRole(roleName)}/agents`;

/* 대화 태그 관련 */
export const conversationTags = (tag?: string) =>
  `/api/tags${tag != null && tag ? `/${encodeURIComponent(tag)}` : ''}`;
export const conversationTagsList = (pageNumber: string, sort?: string, order?: string) =>
  `${conversationTags()}/list?pageNumber=${pageNumber}${sort ? `&sort=${sort}` : ''}${
    order ? `&order=${order}` : ''
  }`;
export const addTagToConversation = (conversationId: string) =>
  `${conversationTags()}/convo/${conversationId}`;

// 사용자 약관
export const userTerms = () => '/api/user/terms';
export const acceptUserTerms = () => '/api/user/terms/accept';

// 배너
export const banner = () => '/api/banner';

// 2단계 인증(2FA)
export const enableTwoFactor = () => '/api/auth/2fa/enable';
export const verifyTwoFactor = () => '/api/auth/2fa/verify';
export const confirmTwoFactor = () => '/api/auth/2fa/confirm';
export const disableTwoFactor = () => '/api/auth/2fa/disable';
export const regenerateBackupCodes = () => '/api/auth/2fa/backup/regenerate';
export const verifyTwoFactorTemp = () => '/api/auth/2fa/verify-temp';

/* 파일 관련 API */
export const files = () => '/api/files';
export const images = () => `${files()}/images`;
export const avatar = () => `${images()}/avatar`;
export const speech = () => `${files()}/speech`;
export const speechToText = () => `${speech()}/stt`;
export const textToSpeech = () => `${speech()}/tts`;
export const textToSpeechManual = () => `${textToSpeech()}/manual`;
export const textToSpeechVoices = () => `${textToSpeech()}/voices`;
export const getCustomConfigSpeech = () => `${speech()}/config/get`;

// 어시스턴트 관련
export const assistants = ({
  path = '',
  options,
  version,
  endpoint,
  isAvatar,
}: {
  path?: string;
  options?: object;
  endpoint?: AssistantsEndpoint;
  version: number | string;
  isAvatar?: boolean;
}) => {
  let url = isAvatar === true ? `${images()}/assistants` : `/api/assistants/v${version}`;

  if (path && path !== '') {
    url += `/${path}`;
  }

  if (endpoint) {
    options = {
      ...(options ?? {}),
      endpoint,
    };
  }

  if (options && Object.keys(options).length > 0) {
    const queryParams = new URLSearchParams(options as Record<string, string>).toString();
    url += `?${queryParams}`;
  }

  return url;
};

// 에이전트 관련
export const agents = ({ path = '', options }: { path?: string; options?: object }) => {
  let url = '/api/agents';

  if (path && path !== '') {
    url += `/${path}`;
  }

  if (options && Object.keys(options).length > 0) {
    const queryParams = new URLSearchParams(options as Record<string, string>).toString();
    url += `?${queryParams}`;
  }

  return url;
};

// 에이전트 버전 되돌리기
export const revertAgentVersion = (agent_id: string) => `${agents({ path: `${agent_id}/revert` })}`;
