import type { Logger as WinstonLogger } from 'winston';
import type { RunnableConfig } from '@langchain/core/runnables';

// 검색 참조 타입: 검색 결과의 분류를 정의
export type SearchRefType = 'search' | 'image' | 'news' | 'video' | 'ref';

// 날짜 범위를 나타내는 열거형 (시간 단위 축약어 사용)
export enum DATE_RANGE {
  PAST_HOUR = 'h',        // 지난 1시간
  PAST_24_HOURS = 'd',    // 지난 24시간
  PAST_WEEK = 'w',        // 지난 1주일
  PAST_MONTH = 'm',       // 지난 1개월
  PAST_YEAR = 'y',        // 지난 1년
}

// 검색 제공자 유형
export type SearchProvider = 'serper' | 'searxng';

// 결과 재정렬(rerank) 방식
export type RerankerType = 'infinity' | 'jina' | 'cohere' | 'none';

// 하이라이트 정보: 점수와 텍스트, 참조 포함 가능
export interface Highlight {
  score: number;                 // 중요도 점수
  text: string;                  // 강조된 텍스트
  references?: UsedReferences;  // 참조된 문서 등
}

// 가공된(처리된) 소스 정보
export type ProcessedSource = {
  content?: string;              // 본문 내용
  attribution?: string;          // 출처 정보
  references?: References;       // 참조된 자료들
  highlights?: Highlight[];      // 하이라이트 정보
  processed?: boolean;           // 가공 여부 표시
};

// 일반 검색 결과 + 처리 정보 포함
export type ProcessedOrganic = OrganicResult & ProcessedSource;

// 상단 뉴스 스토리 결과 + 처리 정보 포함
export type ProcessedTopStory = TopStoryResult & ProcessedSource;

// 처리된 유효한 소스 타입 (일반 검색 or 뉴스)
export type ValidSource = ProcessedOrganic | ProcessedTopStory;

// 개별 참조 링크 정보
export type ResultReference = {
  link: string;                           // 참조 URL
  type: 'link' | 'image' | 'video';       // 참조 유형
  title?: string;                         // 제목
  attribution?: string;                  // 출처 정보
};

// 통합된 검색 결과 데이터 구조
export interface SearchResultData {
  turn?: number;                          // 현재 검색 턴 (대화형 검색 시)
  organic?: ProcessedOrganic[];          // 일반 검색 결과
  topStories?: ProcessedTopStory[];      // 뉴스/헤드라인 결과
  images?: ImageResult[];                // 이미지 결과
  videos?: VideoResult[];                // 동영상 결과
  places?: PlaceResult[];                // 장소 정보 (지도 등)
  news?: NewsResult[];                   // 뉴스 기사
  shopping?: ShoppingResult[];           // 쇼핑 결과
  knowledgeGraph?: KnowledgeGraphResult; // 지식 패널 결과
  answerBox?: AnswerBoxResult;           // 답변 박스 (FAQ, 위키 등)
  peopleAlsoAsk?: PeopleAlsoAskResult[]; // 관련 질문들
  relatedSearches?: Array<{ query: string }>; // 관련 검색어
  references?: ResultReference[];        // 참조 링크 모음
  error?: string;                         // 오류 메시지 (검색 실패 시)
}

// 실제 검색 결과 객체
export interface SearchResult {
  data?: SearchResultData;               // 검색 결과 데이터
  error?: string;                        // 오류 메시지
  success: boolean;                      // 성공 여부
}

// 원본 페이지 정보 (스크래핑 전용)
export interface Source {
  link: string;           // 페이지 링크
  html?: string;          // HTML 원본
  title?: string;         // 제목
  snippet?: string;       // 요약
  date?: string;          // 날짜
}

// 검색 설정 인터페이스
export interface SearchConfig {
  searchProvider?: SearchProvider;         // 검색 엔진 종류
  serperApiKey?: string;                   // Serper API 키
  searxngInstanceUrl?: string;             // SearxNG 인스턴스 주소
  searxngApiKey?: string;                  // SearxNG API 키
}

// 참조 정보 구조
export type References = {
  links: MediaReference[];   // 링크 참조
  images: MediaReference[];  // 이미지 참조
  videos: MediaReference[];  // 동영상 참조
};

// 스크래핑 결과
export interface ScrapeResult {
  url: string;                       // 스크래핑 대상 URL
  error?: boolean;                  // 오류 발생 여부
  content: string;                  // 스크랩된 본문
  attribution?: string;             // 출처
  references?: References;          // 참조 정보
  highlights?: Highlight[];         // 강조된 텍스트 정보
}

// 소스 처리 설정
export interface ProcessSourcesConfig {
  topResults?: number;              // 상위 결과 개수 제한
  strategies?: string[];            // 처리 전략 목록
  filterContent?: boolean;          // 콘텐츠 필터링 여부
  reranker?: unknown;               // 재정렬기 설정 (사용자 정의)
  logger?: Logger;                  // 로깅 도구
}

// Firecrawl 관련 API 설정
export interface FirecrawlConfig {
  firecrawlApiKey?: string;         // API 키
  firecrawlApiUrl?: string;         // API 엔드포인트
  firecrawlFormats?: string[];      // 지원 포맷 (예: HTML, JSON 등)
}

// 스크래퍼 콘텐츠 결과 (내용만 반환)
export interface ScraperContentResult {
  content: string;
}

// 스크래퍼 추출 결과 구조
export interface ScraperExtractionResult {
  no_extraction: ScraperContentResult;
}

// Jina 기반 Reranker 결과
export interface JinaRerankerResult {
  index: number;                    // 문서 인덱스
  relevance_score: number;         // 관련성 점수
  document?: string | { text: string }; // 문서 내용
}

// Jina 응답 전체 구조
export interface JinaRerankerResponse {
  model: string;                   // 사용된 모델명
  usage: {
    total_tokens: number;         // 사용된 토큰 수
  };
  results: JinaRerankerResult[];  // 결과 목록
}

// Cohere 기반 Reranker 결과
export interface CohereRerankerResult {
  index: number;                   // 문서 인덱스
  relevance_score: number;        // 관련성 점수
}

// Cohere 응답 전체 구조
export interface CohereRerankerResponse {
  results: CohereRerankerResult[];  // 결과 목록
  id: string;                       // 요청 ID
  meta: {
    api_version: {
      version: string;             // API 버전
      is_experimental: boolean;    // 실험적 기능 여부
    };
    billed_units: {
      search_units: number;        // 과금된 검색 단위 수
    };
  };
}

// 안전 검색 수준: 0(해제), 1(중간), 2(엄격)
export type SafeSearchLevel = 0 | 1 | 2;

// 로깅 도구 타입 (Winston 기반)
export type Logger = WinstonLogger;

// 검색 도구의 설정을 정의하는 인터페이스
export interface SearchToolConfig extends SearchConfig, ProcessSourcesConfig, FirecrawlConfig {
  logger?: Logger; // 로그 기록기
  safeSearch?: SafeSearchLevel; // 안전 검색 수준
  jinaApiKey?: string; // Jina API 키
  cohereApiKey?: string; // Cohere API 키
  rerankerType?: RerankerType; // 재정렬 알고리즘 종류
  onSearchResults?: (results: SearchResult, runnableConfig?: RunnableConfig) => void; // 검색 결과 콜백
  onGetHighlights?: (link: string) => void; // 하이라이트 수집 콜백
}

// 미디어 참조 정보 (예: 링크된 이미지, 동영상 등)
export interface MediaReference {
  originalUrl: string; // 원본 URL
  title?: string; // 제목
  text?: string; // 텍스트 설명
}

// 사용된 참조 정보 목록
export type UsedReferences = {
  type: 'link' | 'image' | 'video'; // 참조 유형
  originalIndex: number; // 원래 결과 순서
  reference: MediaReference; // 참조된 미디어 정보
}[];

/** Firecrawl: 웹 페이지 크롤링 설정 및 응답 정의 */

// 크롤링 옵션
export interface FirecrawlScrapeOptions {
  formats?: string[]; // 추출할 포맷 (예: html, markdown 등)
  includeTags?: string[]; // 포함할 HTML 태그
  excludeTags?: string[]; // 제외할 HTML 태그
  headers?: Record<string, string>; // 요청 헤더
  waitFor?: number; // 대기 시간 (ms)
  timeout?: number; // 최대 대기 시간 (ms)
}

// 스크래핑된 메타데이터 정보
export interface ScrapeMetadata {
  // 소스 정보
  sourceURL?: string;
  url?: string;
  scrapeId?: string;
  statusCode?: number;

  // 일반 메타데이터
  title?: string;
  description?: string;
  language?: string;
  favicon?: string;
  viewport?: string;
  robots?: string;
  'theme-color'?: string;

  // Open Graph 메타데이터
  'og:url'?: string;
  'og:title'?: string;
  'og:description'?: string;
  'og:type'?: string;
  'og:image'?: string;
  'og:image:width'?: string;
  'og:image:height'?: string;
  'og:site_name'?: string;
  ogUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;

  // 기사 관련 메타데이터
  'article:author'?: string;
  'article:published_time'?: string;
  'article:modified_time'?: string;
  'article:section'?: string;
  'article:tag'?: string;
  'article:publisher'?: string;
  publishedTime?: string;
  modifiedTime?: string;

  // 트위터 메타데이터
  'twitter:site'?: string | boolean | number | null;
  'twitter:creator'?: string;
  'twitter:card'?: string;
  'twitter:image'?: string;
  'twitter:dnt'?: string;
  'twitter:app:name:iphone'?: string;
  'twitter:app:id:iphone'?: string;
  'twitter:app:url:iphone'?: string;
  'twitter:app:name:ipad'?: string;
  'twitter:app:id:ipad'?: string;
  'twitter:app:url:ipad'?: string;
  'twitter:app:name:googleplay'?: string;
  'twitter:app:id:googleplay'?: string;
  'twitter:app:url:googleplay'?: string;

  // 페이스북 메타데이터
  'fb:app_id'?: string;

  // 앱 링크 메타데이터
  'al:ios:url'?: string;
  'al:ios:app_name'?: string;
  'al:ios:app_store_id'?: string;

  // 기타 확장 필드 허용
  [key: string]: string | number | boolean | null | undefined;
}

// Firecrawl 스크래핑 응답 포맷
export interface FirecrawlScrapeResponse {
  success: boolean; // 성공 여부
  data?: {
    markdown?: string; // 마크다운 결과
    html?: string; // HTML 결과
    rawHtml?: string; // 원본 HTML
    screenshot?: string; // 스크린샷 (base64 등)
    links?: string[]; // 추출된 링크들
    metadata?: ScrapeMetadata; // 메타데이터 정보
  };
  error?: string; // 오류 메시지
}

// Firecrawl 설정
export interface FirecrawlScraperConfig {
  apiKey?: string; // API 키
  apiUrl?: string; // API 엔드포인트
  formats?: string[]; // 추출 포맷
  timeout?: number; // 타임아웃
  logger?: Logger; // 로깅 설정
}

// 🔍 소스를 가져올 때 사용하는 파라미터 타입 정의
export type GetSourcesParams = {
  query: string; // 검색어
  date?: DATE_RANGE; // 날짜 범위 필터 (예: 최근 1일, 1주 등)
  country?: string; // 국가 코드 (예: "us", "kr")
  numResults?: number; // 가져올 결과 수
  safeSearch?: SearchToolConfig['safeSearch']; // 안전 검색 수준
  images?: boolean; // 이미지 결과 포함 여부
  videos?: boolean; // 비디오 결과 포함 여부
  news?: boolean; // 뉴스 결과 포함 여부
  type?: 'search' | 'images' | 'videos' | 'news'; // 검색 유형
};

// Serper API로부터 가져온 비디오 검색 결과 형식
export interface VideoResult {
  title?: string; // 제목
  link?: string; // 비디오 링크
  snippet?: string; // 설명 텍스트
  imageUrl?: string; // 썸네일 이미지
  duration?: string; // 재생 시간
  source?: string; // 출처 (예: YouTube)
  channel?: string; // 채널 이름
  date?: string; // 게시 날짜
  position?: number; // 결과 순위
}

export interface PlaceResult {
  position?: number; // 결과 순위
  name?: string; // 장소 이름
  address?: string; // 주소
  latitude?: number; // 위도
  longitude?: number; // 경도
  rating?: number; // 평점
  ratingCount?: number; // 평점 수
  category?: string; // 카테고리
  identifier?: string; // 고유 ID
}

export interface NewsResult {
  title?: string; // 제목
  link?: string; // 기사 링크
  snippet?: string; // 요약
  date?: string; // 발행일
  source?: string; // 출처
  imageUrl?: string; // 이미지 URL
  position?: number; // 순서
}

export interface ShoppingResult {
  title?: string;
  source?: string; // 쇼핑몰 이름
  link?: string;
  price?: string;
  delivery?: string; // 배송 정보
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  offers?: string; // 추가 혜택
  productId?: string;
  position?: number;
}

export interface ScholarResult {
  title?: string;
  link?: string;
  publicationInfo?: string; // 출판 정보
  snippet?: string;
  year?: number;
  citedBy?: number; // 인용 횟수
}

export interface ImageResult {
  title?: string;
  imageUrl?: string; // 원본 이미지
  imageWidth?: number;
  imageHeight?: number;
  thumbnailUrl?: string; // 썸네일
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  source?: string; // 출처 사이트
  domain?: string;
  link?: string;
  googleUrl?: string;
  position?: number;
}

export interface SerperSearchPayload extends SerperSearchInput {
  /**
   * 검색 유형 (세로 도메인)
   * 예: 웹검색(search), 이미지(images), 뉴스(news), 장소(places), 비디오(videos)
   */
  type?: 'search' | 'images' | 'news' | 'places' | 'videos';

  /**
   * 페이징 처리를 위한 시작 인덱스 (페이지 대신 사용됨)
   */
  start?: number;

  /**
   * 안전 검색 필터링 수준
   * 'off': 꺼짐, 'moderate': 중간, 'active': 강력 필터링
   */
  safe?: 'off' | 'moderate' | 'active';
}

export type SerperSearchParameters = Pick<SerperSearchPayload, 'q' | 'type'> & {
  engine: 'google'; // 검색 엔진은 Google만 사용
};

export interface OrganicResult {
  position?: number; // 검색 순위
  title?: string;
  link: string; // 결과 링크 (필수)
  snippet?: string; // 요약
  date?: string;
  sitelinks?: Array<{ // 하위 사이트 링크
    title: string;
    link: string;
  }>;
}

export interface TopStoryResult {
  title?: string;
  link: string;
  source?: string;
  date?: string;
  imageUrl?: string;
}

export interface KnowledgeGraphResult {
  title?: string;
  type?: string; // 예: "기업", "인물", "장소"
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>; // 속성(key-value)
  website?: string; // 공식 웹사이트
}

export interface AnswerBoxResult {
  title?: string;
  snippet?: string;
  snippetHighlighted?: string[]; // 강조된 문구
  link?: string;
  date?: string;
}

export interface PeopleAlsoAskResult {
  question?: string;
  snippet?: string;
  title?: string;
  link?: string;
}

export type RelatedSearches = Array<{ query: string }>; // 관련된 검색어 문자열

export interface SerperSearchInput {
  /**
   * 실제 검색어 문자열
   */
  q: string;

  /**
   * 결과 국가 코드 (예: "us", "kr", "jp" 등)
   */
  gl?: string;

  /**
   * 인터페이스 언어 (예: "en", "ko", "ja")
   */
  hl?: string;

  /**
   * 최대 반환 결과 수 (최대 100개)
   */
  num?: number;

  /**
   * 특정 위치 기반 검색 (예: "Seoul, Korea")
   */
  location?: string;

  /**
   * 자동 교정 설정 (예: 철자 수정)
   */
  autocorrect?: boolean;

  page?: number;

  /**
   * 시간 필터 (tbs 파라미터로 전달됨)
   * 예: "qdr:h" (1시간), "qdr:w" (1주)
   */
  tbs?: string;
}

export type SerperResultData = {
  searchParameters: SerperSearchPayload; // 검색 시 사용된 파라미터
  organic?: OrganicResult[];             // 일반 웹 검색 결과
  topStories?: TopStoryResult[];         // 상단 뉴스 스토리
  images?: ImageResult[];                // 이미지 결과
  videos?: VideoResult[];                // 동영상 결과
  places?: PlaceResult[];                // 장소/지도 결과
  news?: NewsResult[];                   // 뉴스 기사 결과
  shopping?: ShoppingResult[];           // 쇼핑 관련 결과
  peopleAlsoAsk?: PeopleAlsoAskResult[]; // "사람들이 함께 묻는 질문" 섹션
  relatedSearches?: RelatedSearches;     // 관련 검색어 목록
  knowledgeGraph?: KnowledgeGraphResult; // 지식 그래프 결과 (사이드 카드 등)
  answerBox?: AnswerBoxResult;           // 답변 박스 (즉답 박스)
  credits?: number;                      // 사용한 크레딧 수 (요금제 기반)
};

export interface SearxNGSearchPayload {
  /**
   * 검색어 문자열
   * 다양한 검색엔진의 고유 문법도 지원됨 (예: site:github.com ...)
   */
  q: string;

  /**
   * 사용할 검색 카테고리 목록 (콤마로 구분)
   * 예: "general,images,news"
   */
  categories?: string;

  /**
   * 사용할 검색 엔진 목록 (콤마로 구분)
   * 예: "google,bing,duckduckgo"
   */
  engines?: string;

  /**
   * 결과 언어 코드 (예: "en", "ko", "fr")
   */
  language?: string;

  /**
   * 검색 페이지 번호 (기본값: 1)
   */
  pageno?: number;

  /**
   * 검색 결과의 시간 범위 필터
   * "day", "month", "year" 중 선택
   */
  time_range?: 'day' | 'month' | 'year';

  /**
   * 결과 포맷 선택
   * 예: "json", "csv", "rss"
   */
  format?: 'json' | 'csv' | 'rss';

  /**
   * 검색 결과를 새 탭에서 열지 여부
   * 0: 끄기, 1: 켜기
   */
  results_on_new_tab?: 0 | 1;

  /**
   * 이미지 결과를 프록시를 통해 불러올지 여부
   * true: 프록시 사용, false: 직접 연결
   */
  image_proxy?: boolean;

  /**
   * 자동완성 기능 제공자
   * 예: "google", "wikipedia", "qwant" 등
   */
  autocomplete?: string;

  /**
   * 안전 검색 수준
   * 0: 해제, 1: 중간, 2: 엄격
   */
  safesearch?: 0 | 1 | 2;

  /**
   * 결과 페이지에 사용할 테마 이름
   * 기본값: "simple"
   */
  theme?: string;

  /**
   * 활성화할 플러그인 목록
   * 기본값: "Hash_plugin,Self_Information,Tracker_URL_remover,Ahmia_blacklist"
   */
  enabled_plugins?: string;

  /**
   * 비활성화할 플러그인 목록
   */
  disabled_plugins?: string;

  /**
   * 활성화할 검색 엔진 목록
   */
  enabled_engines?: string;

  /**
   * 비활성화할 검색 엔진 목록
   */
  disabled_engines?: string;
}

export interface SearXNGResult {
  title?: string;            // 결과 제목
  url?: string;              // 결과 링크
  content?: string;          // 요약 또는 본문 일부
  publishedDate?: string;    // 게시일
  img_src?: string;          // 이미지 썸네일 URL
}

export type ProcessSourcesFields = {
  result: SearchResult;                                // 검색 결과 전체
  numElements: number;                                 // 처리할 항목 수
  query: string;                                       // 검색어
  news: boolean;                                       // 뉴스 처리 여부
  proMode: boolean;                                    // 전문가 모드 여부
  onGetHighlights: SearchToolConfig['onGetHighlights']; // 하이라이트 추출 콜백
};
