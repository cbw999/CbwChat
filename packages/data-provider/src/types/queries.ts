// react-query에서 무한 스크롤 데이터를 위한 타입
import type { InfiniteData } from '@tanstack/react-query';

// 타입 정의 불러오기
import type * as a from '../types/agents';
import type * as s from '../schemas';
import type * as t from '../types';


// 하나의 대화(conversation)에 대한 정보 타입
export type Conversation = {
  id: string; // 대화 ID
  createdAt: number; // 생성 시간 (타임스탬프)
  participants: string[]; // 참여자 목록
  lastMessage: string; // 마지막 메시지 내용
  conversations: s.TConversation[]; // 실제 대화 객체 리스트
};

// 대화 리스트 조회 시 사용할 파라미터
export type ConversationListParams = {
  cursor?: string; // 페이징용 커서
  isArchived?: boolean; // 보관된 대화 포함 여부
  sortBy?: 'title' | 'createdAt' | 'updatedAt'; // 정렬 기준
  sortDirection?: 'asc' | 'desc'; // 정렬 방향
  tags?: string[]; // 태그 필터
  search?: string; // 검색어
};

// 최소한의 대화 정보만 포함한 타입
export type MinimalConversation = Pick<
  s.TConversation,
  'conversationId' | 'endpoint' | 'title' | 'createdAt' | 'updatedAt' | 'user'
>;

// 대화 리스트 응답 타입
export type ConversationListResponse = {
  conversations: MinimalConversation[]; // 대화 리스트
  nextCursor: string | null; // 다음 페이지 커서
};

// 무한 스크롤에서 사용할 대화 데이터 타입
export type ConversationData = InfiniteData<ConversationListResponse>;

// 대화 데이터 업데이트 함수 타입
export type ConversationUpdater = (
  data: ConversationData,
  conversation: s.TConversation,
) => ConversationData;


/* 메시지 관련 타입 */

// 메시지 목록 요청 파라미터
export type MessagesListParams = {
  cursor?: string | null; // 페이징 커서
  sortBy?: 'endpoint' | 'createdAt' | 'updatedAt'; // 정렬 기준
  sortDirection?: 'asc' | 'desc'; // 정렬 방향
  pageSize?: number; // 페이지 크기
  conversationId?: string; // 특정 대화 ID
  messageId?: string; // 특정 메시지 ID
  search?: string; // 검색어
};

// 메시지 목록 응답 타입
export type MessagesListResponse = {
  messages: s.TMessage[]; // 메시지 배열
  nextCursor: string | null; // 다음 페이지 커서
};


/* 공유 링크 관련 타입 */

// 공유된 메시지 응답 타입 (messages 필드만 별도로 정의)
export type SharedMessagesResponse = Omit<s.TSharedLink, 'messages'> & {
  messages: s.TMessage[]; // 공유된 메시지 배열
};

// 공유 링크 목록 요청 파라미터
export interface SharedLinksListParams {
  pageSize: number; // 페이지당 항목 수
  isPublic: boolean; // 공개 여부 필터
  sortBy: 'title' | 'createdAt'; // 정렬 기준
  sortDirection: 'asc' | 'desc'; // 정렬 방향
  search?: string; // 검색어
  cursor?: string; // 페이징 커서
}

// 공유 링크 항목 타입
export type SharedLinkItem = {
  shareId: string; // 공유 링크 ID
  title: string; // 제목
  isPublic: boolean; // 공개 여부
  createdAt: Date; // 생성일
  conversationId: string; // 연결된 대화 ID
};

// 공유 링크 리스트 응답 타입
export interface SharedLinksResponse {
  links: SharedLinkItem[]; // 링크 리스트
  nextCursor: string | null; // 다음 커서
  hasNextPage: boolean; // 다음 페이지 존재 여부
}

// 공유 링크 쿼리 데이터 (무한 스크롤용)
export interface SharedLinkQueryData {
  pages: SharedLinksResponse[]; // 페이지별 응답 데이터
  pageParams: (string | null)[]; // 각 페이지의 커서
}


// 프롬프트 그룹 전체 필터 요청 타입
export type AllPromptGroupsFilterRequest = {
  category: string;
  pageNumber: string;
  pageSize: string | number;
  before?: string | null;
  after?: string | null;
  order?: 'asc' | 'desc';
  name?: string;
  author?: string;
};

// 프롬프트 그룹 전체 응답 타입
export type AllPromptGroupsResponse = t.TPromptGroup[];

// 대화에 붙은 태그 목록 응답
export type ConversationTagsResponse = s.TConversationTag[];

// 툴 인증 확인을 위한 요청 및 응답 타입
export type VerifyToolAuthParams = { toolId: string };
export type VerifyToolAuthResponse = {
  authenticated: boolean; // 인증 여부
  message?: string | s.AuthType; // 메시지 또는 인증 타입 정보
  authTypes?: [string, s.AuthType][]; // 사용 가능한 인증 타입들
};

// 툴 실행 결과를 조회할 때 사용하는 요청 및 응답 타입
export type GetToolCallParams = { conversationId: string };
export type ToolCallResults = a.ToolCallResult[]; // 툴 호출 결과 배열
