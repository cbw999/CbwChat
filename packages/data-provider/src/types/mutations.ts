// 필요한 타입과 상수들을 가져옵니다.
import * as types from '../types';
import * as r from '../roles';
import * as p from '../permissions';
import {
  Tools,
  Assistant,
  AssistantCreateParams,
  AssistantUpdateParams,
  ActionMetadata,
  FunctionTool,
  AssistantDocument,
  Action,
  Agent,
  AgentCreateParams,
  AgentUpdateParams,
} from './assistants';

// 비동기 Mutation 처리 시 사용되는 옵션 타입 정의
export type MutationOptions<
  Response,
  Request,
  Context = unknown,
  Error = unknown,
  Snapshot = void,
> = {
  onSuccess?: (data: Response, variables: Request, context?: Context) => void;
  onMutate?: (variables: Request) => Snapshot | Promise<Snapshot>;
  onError?: (error: Error, variables: Request, context?: Context, snapshot?: Snapshot) => void;
  onSettled?: (
    data: Response | undefined,
    error: Error | null,
    variables: Request,
    context?: Context,
  ) => void;
};

// 타이틀 자동 생성 관련 요청 및 응답 타입
export type TGenTitleRequest = {
  conversationId: string;
};
export type TGenTitleResponse = {
  title: string;
};

// 프리셋 삭제 응답 타입
export type PresetDeleteResponse = {
  acknowledged: boolean;
  deletedCount: number;
};

// 프리셋 관련 Mutation 옵션
export type UpdatePresetOptions = MutationOptions<types.TPreset, types.TPreset>;
export type DeletePresetOptions = MutationOptions<PresetDeleteResponse, types.TPreset | undefined>;

/* Assistant 관련 Mutation 타입들 */

// 어시스턴트 아바타 업로드 시 필요한 변수
export type AssistantAvatarVariables = {
  assistant_id: string;
  model: string;
  formData: FormData;
  postCreation?: boolean;
  endpoint: types.AssistantsEndpoint;
  version: number | string;
};

// 액션 업데이트 시 필요한 변수
export type UpdateActionVariables = {
  assistant_id: string;
  functions: FunctionTool[];
  metadata: ActionMetadata;
  action_id?: string;
  model: string;
  endpoint: types.AssistantsEndpoint;
  version: number | string;
};

// 어시스턴트 관련 Mutation 옵션들
export type UploadAssistantAvatarOptions = MutationOptions<Assistant, AssistantAvatarVariables>;
export type CreateAssistantMutationOptions = MutationOptions<Assistant, AssistantCreateParams>;

export type UpdateAssistantVariables = {
  assistant_id: string;
  data: AssistantUpdateParams;
};
export type UpdateAssistantMutationOptions = MutationOptions<Assistant, UpdateAssistantVariables>;

export type DeleteAssistantBody = {
  assistant_id: string;
  model: string;
  endpoint: types.AssistantsEndpoint;
};
export type DeleteAssistantMutationOptions = MutationOptions<
  void,
  Pick<DeleteAssistantBody, 'assistant_id'>
>;

// 액션 업데이트에 대한 응답 타입 및 옵션
export type UpdateActionResponse = [AssistantDocument, Assistant, Action];
export type UpdateActionOptions = MutationOptions<UpdateActionResponse, UpdateActionVariables>;

// 액션 삭제 관련 변수 및 옵션
export type DeleteActionVariables = {
  endpoint: types.AssistantsEndpoint;
  assistant_id: string;
  action_id: string;
  model: string;
};
export type DeleteActionOptions = MutationOptions<void, DeleteActionVariables>;

/* Agent 관련 Mutation 타입들 */

export type AgentAvatarVariables = {
  agent_id: string;
  formData: FormData;
  postCreation?: boolean;
};

export type UpdateAgentActionVariables = {
  agent_id: string;
  action_id?: string;
  metadata: ActionMetadata;
  functions: FunctionTool[];
};

export type UploadAgentAvatarOptions = MutationOptions<Agent, AgentAvatarVariables>;
export type CreateAgentMutationOptions = MutationOptions<Agent, AgentCreateParams>;

export type UpdateAgentVariables = {
  agent_id: string;
  data: AgentUpdateParams;
};

// 중복 버전 관련 에러 타입 정의
export type DuplicateVersionError = Error & {
  statusCode?: number;
  details?: {
    duplicateVersion?: unknown;
    versionIndex?: number;
  };
};

export type UpdateAgentMutationOptions = MutationOptions<
  Agent,
  UpdateAgentVariables,
  unknown,
  DuplicateVersionError
>;

// Agent 복제 관련
export type DuplicateAgentBody = {
  agent_id: string;
};
export type DuplicateAgentMutationOptions = MutationOptions<
  { agent: Agent; actions: Action[] },
  Pick<DuplicateAgentBody, 'agent_id'>
>;

// Agent 삭제 관련
export type DeleteAgentBody = {
  agent_id: string;
};
export type DeleteAgentMutationOptions = MutationOptions<void, Pick<DeleteAgentBody, 'agent_id'>>;

// Agent 액션 업데이트 및 삭제 관련
export type UpdateAgentActionResponse = [Agent, Action];
export type UpdateAgentActionOptions = MutationOptions<
  UpdateAgentActionResponse,
  UpdateAgentActionVariables
>;

export type DeleteAgentActionVariables = {
  agent_id: string;
  action_id: string;
};
export type DeleteAgentActionOptions = MutationOptions<void, DeleteAgentActionVariables>;

// Agent 버전 되돌리기
export type RevertAgentVersionVariables = {
  agent_id: string;
  version_index: number;
};
export type RevertAgentVersionOptions = MutationOptions<Agent, RevertAgentVersionVariables>;

// 대화 삭제, 보관, 복제, 포크 등의 옵션들
export type DeleteConversationOptions = MutationOptions<
  types.TDeleteConversationResponse,
  types.TDeleteConversationRequest
>;
export type ArchiveConversationOptions = MutationOptions<
  types.TArchiveConversationResponse,
  types.TArchiveConversationRequest
>;
export type DuplicateConvoOptions = MutationOptions<
  types.TDuplicateConvoResponse,
  types.TDuplicateConvoRequest
>;
export type ForkConvoOptions = MutationOptions<types.TForkConvoResponse, types.TForkConvoRequest>;

// 공유 링크 생성, 수정, 삭제 옵션
export type CreateSharedLinkOptions = MutationOptions<
  types.TSharedLink,
  Partial<types.TSharedLink>
>;
export type UpdateSharedLinkOptions = MutationOptions<
  types.TSharedLink,
  Partial<types.TSharedLink>
>;

export type DeleteSharedLinkContext = { previousQueries?: Map<string, TDeleteSharedLinkResponse> };
export type DeleteSharedLinkOptions = MutationOptions<
  TDeleteSharedLinkResponse,
  { shareId: string },
  DeleteSharedLinkContext
>;

// 프롬프트 그룹 및 프롬프트 관련 옵션들
export type TUpdatePromptContext =
  | {
      group?: types.TPromptGroup;
      previousListData?: types.PromptGroupListData;
    }
  | undefined;

export type UpdatePromptGroupOptions = MutationOptions<
  types.TUpdatePromptGroupResponse,
  types.TUpdatePromptGroupVariables,
  TUpdatePromptContext
>;
export type CreatePromptOptions = MutationOptions<types.TCreatePromptResponse, types.TCreatePrompt>;
export type DeletePromptOptions = MutationOptions<
  types.TDeletePromptResponse,
  types.TDeletePromptVariables
>;
export type DeletePromptGroupOptions = MutationOptions<
  types.TDeletePromptGroupResponse,
  types.TDeletePromptGroupRequest
>;
export type UpdatePromptLabelOptions = MutationOptions<
  types.TUpdatePromptLabelsResponse,
  types.TUpdatePromptLabelsRequest
>;
export type MakePromptProductionOptions = MutationOptions<
  types.TMakePromptProductionResponse,
  types.TMakePromptProductionRequest,
  TUpdatePromptContext
>;

/* 인증 관련 Mutation 옵션들 */
export type VerifyEmailOptions = MutationOptions<types.VerifyEmailResponse, types.TVerifyEmail>;
export type ResendVerifcationOptions = MutationOptions<
  types.VerifyEmailResponse,
  types.TResendVerificationEmail
>;
export type RegistrationOptions = MutationOptions<
  types.TRegisterUserResponse,
  types.TRegisterUser,
  unknown,
  types.TError
>;

// 권한 설정 관련 타입
export type UpdatePermVars<T> = {
  roleName: string;
  updates: Partial<T>;
};
export type UpdatePromptPermVars = UpdatePermVars<p.TPromptPermissions>;
export type UpdateAgentPermVars = UpdatePermVars<p.TAgentPermissions>;

export type UpdatePermResponse = r.TRole;
export type UpdatePromptPermOptions = MutationOptions<
  UpdatePermResponse,
  UpdatePromptPermVars,
  unknown,
  types.TError | null | undefined
>;
export type UpdateAgentPermOptions = MutationOptions<
  UpdatePermResponse,
  UpdateAgentPermVars,
  unknown,
  types.TError | null | undefined
>;

// 대화 태그 관련 옵션
export type UpdateConversationTagOptions = MutationOptions<
  types.TConversationTag,
  types.TConversationTagRequest
>;
export type DeleteConversationTagOptions = MutationOptions<types.TConversationTag, string>;

// 이용 약관 동의 관련 옵션
export type AcceptTermsMutationOptions = MutationOptions<
  types.TAcceptTermsResponse,
  void,
  unknown,
  void
>;

/* 플러그인 인증 정보 업데이트 */
export type UpdatePluginAuthOptions = MutationOptions<types.TUser, types.TUpdateUserPlugins>;

/* 툴 사용 관련 타입 정의 */
export type ToolParamsMap = {
  [Tools.execute_code]: {
    lang: string;
    code: string;
  };
};

export type ToolId = keyof ToolParamsMap;

export type ToolParams<T extends ToolId> = ToolParamsMap[T] & {
  messageId: string;
  partIndex?: number;
  blockIndex?: number;
  conversationId: string;
};

export type ToolCallResponse = { result: unknown; attachments?: types.TAttachment[] };
export type ToolCallMutationOptions<T extends ToolId> = MutationOptions<
  ToolCallResponse,
  ToolParams<T>
>;

/* 아티팩트(산출물) 편집 관련 */
export type TDeleteSharedLinkResponse = {
  success: boolean;
  shareId: string;
  message: string;
};

export type TEditArtifactRequest = {
  index: number;
  messageId: string;
  original: string;
  updated: string;
};

export type TEditArtifactResponse = Pick<types.TMessage, 'content' | 'text' | 'conversationId'>;
export type EditArtifactOptions = MutationOptions<
  TEditArtifactResponse,
  TEditArtifactRequest,
  unknown,
  Error
>;

/* 로그아웃 */
export type TLogoutResponse = {
  message: string;
  redirect?: string;
};
export type LogoutOptions = MutationOptions<TLogoutResponse, undefined>;
