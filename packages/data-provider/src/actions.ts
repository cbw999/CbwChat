// 필요한 모듈 및 타입들을 불러옴
import { z } from 'zod'; // Zod 스키마 검증 라이브러리
import _axios from 'axios'; // HTTP 클라이언트
import { URL } from 'url'; // URL 처리를 위한 모듈
import crypto from 'crypto'; // 해시 함수 사용
import { load } from 'js-yaml'; // YAML 파싱

// 타입 정의 불러오기
import type {
  FunctionTool,
  Schema,
  Reference,
  ActionMetadata,
  ActionMetadataRuntime,
} from './types/assistants';
import type { OpenAPIV3 } from 'openapi-types';
import { Tools, AuthTypeEnum, AuthorizationTypeEnum } from './types/assistants';

// OpenAPI 파라미터 스키마 타입 정의
export type ParametersSchema = {
  type: string;
  properties: Record<string, Reference | Schema>;
  required: string[];
  additionalProperties?: boolean;
};

// OpenAPI 스키마 타입 정의 (items 속성 포함)
export type OpenAPISchema = OpenAPIV3.SchemaObject &
  ParametersSchema & {
    items?: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
  };

// API Key 방식 인증 자격 증명
export type ApiKeyCredentials = {
  api_key: string;
  custom_auth_header?: string;
  authorization_type?: AuthorizationTypeEnum;
};

// OAuth 방식 인증 자격 증명
export type OAuthCredentials = {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
};

// 두 인증 방식 중 하나를 선택할 수 있음
export type Credentials = ApiKeyCredentials | OAuthCredentials;

// HTTP 요청의 콘텐츠 정의 타입
type MediaTypeObject =
  | undefined
  | {
      [media: string]: OpenAPIV3.MediaTypeObject | undefined;
    };

// RequestBody 객체에서 content 속성만 제외한 타입
type RequestBodyObject = Omit<OpenAPIV3.RequestBodyObject, 'content'> & {
  content: MediaTypeObject;
};

// SHA-1 해시 생성 함수
export function sha1(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

// 도메인과 경로를 합쳐서 URL을 생성하는 함수
export function createURL(domain: string, path: string) {
  const cleanDomain = domain.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  const fullURL = `${cleanDomain}/${cleanPath}`;
  return new URL(fullURL).toString();
}

// OpenAPI 스키마 타입에 따른 Zod 스키마 생성 함수들 정의
const schemaTypeHandlers: Record<string, (schema: OpenAPISchema) => z.ZodTypeAny> = {
  string: (schema) => {
    if (schema.enum) {
      return z.enum(schema.enum as [string, ...string[]]);
    }
    let stringSchema = z.string();
    if (schema.minLength !== undefined) {
      stringSchema = stringSchema.min(schema.minLength);
    }
    if (schema.maxLength !== undefined) {
      stringSchema = stringSchema.max(schema.maxLength);
    }
    return stringSchema;
  },
  number: (schema) => {
    let numberSchema = z.number();
    if (schema.minimum !== undefined) numberSchema = numberSchema.min(schema.minimum);
    if (schema.maximum !== undefined) numberSchema = numberSchema.max(schema.maximum);
    return numberSchema;
  },
  integer: (schema) => (schemaTypeHandlers.number(schema) as z.ZodNumber).int(),
  boolean: () => z.boolean(),
  array: (schema) => {
    if (schema.items) {
      const zodSchema = openAPISchemaToZod(schema.items as OpenAPISchema);
      return z.array(zodSchema ?? z.unknown());
    }
    return z.array(z.unknown());
  },
  object: (schema) => {
    const shape: { [key: string]: z.ZodTypeAny } = {};
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, value]) => {
        const zodSchema = openAPISchemaToZod(value as OpenAPISchema) || z.unknown();
        shape[key] = schema.required?.includes(key)
          ? zodSchema.describe(value.description || '')
          : zodSchema.optional().describe(value.description || '');
      });
    }
    return z.object(shape);
  },
};

// OpenAPI 스키마를 Zod 스키마로 변환하는 함수
function openAPISchemaToZod(schema: OpenAPISchema): z.ZodTypeAny | undefined {
  if (schema.type === 'object' && Object.keys(schema.properties || {}).length === 0) return undefined;
  const handler = schemaTypeHandlers[schema.type as string] || (() => z.unknown());
  return handler(schema);
}

// OpenAPI의 함수 시그니처를 나타내는 클래스
export class FunctionSignature {
  name: string;
  description: string;
  parameters: ParametersSchema;
  strict: boolean;

  constructor(name: string, description: string, parameters: ParametersSchema, strict?: boolean) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.strict = strict ?? false;
  }

  // FunctionTool 객체로 변환
  toObjectTool(): FunctionTool {
    const parameters = {
      ...this.parameters,
      additionalProperties: this.strict ? false : undefined,
    };

    return {
      type: Tools.function,
      function: {
        name: this.name,
        description: this.description,
        parameters,
        ...(this.strict ? { strict: this.strict } : {}),
      },
    };
  }
}

// 요청 설정 클래스
class RequestConfig {
  constructor(
    readonly domain: string,
    readonly basePath: string,
    readonly method: string,
    readonly operation: string,
    readonly isConsequential: boolean,
    readonly contentType: string,
    readonly parameterLocations?: Record<string, 'query' | 'path' | 'header' | 'body'>,
  ) {}
}

// 실제 HTTP 요청을 실행하는 클래스
class RequestExecutor {
  path: string;
  params?: Record<string, unknown>;
  private operationHash?: string;
  private authHeaders: Record<string, string> = {};
  private authToken?: string;

  constructor(private config: RequestConfig) {
    this.path = config.basePath;
  }

  // 요청 파라미터 설정 및 경로 내 치환 처리
  setParams(params: Record<string, unknown>) {
    this.operationHash = sha1(JSON.stringify(params));
    this.params = { ...params };

    const locations = this.config.parameterLocations;

    for (const [key, value] of Object.entries(params)) {
      const paramPattern = `{${key}}`;
      const isPath = locations?.[key] === 'path' || !locations;
      if (isPath && this.path.includes(paramPattern)) {
        this.path = this.path.replace(paramPattern, encodeURIComponent(String(value)));
        delete this.params[key];
      }
    }

    return this;
  }

  // 인증 헤더 설정
  async setAuth(metadata: ActionMetadataRuntime) {
    if (!metadata.auth) return this;

    const {
      type, authorization_type, custom_auth_header,
      authorization_url, client_url, scope, token_exchange_method,
    } = metadata.auth;

    const {
      api_key, oauth_client_id, oauth_client_secret,
      oauth_token_expires_at, oauth_access_token = '',
    } = metadata;

    const isApiKey = api_key && type === AuthTypeEnum.ServiceHttp;
    const isOAuth = oauth_client_id && oauth_client_secret && type === AuthTypeEnum.OAuth;

    // API Key 인증 처리
    if (isApiKey && authorization_type === AuthorizationTypeEnum.Basic) {
      const basicToken = Buffer.from(api_key).toString('base64');
      this.authHeaders['Authorization'] = `Basic ${basicToken}`;
    } else if (isApiKey && authorization_type === AuthorizationTypeEnum.Bearer) {
      this.authHeaders['Authorization'] = `Bearer ${api_key}`;
    } else if (isApiKey && authorization_type === AuthorizationTypeEnum.Custom && custom_auth_header) {
      this.authHeaders[custom_auth_header] = api_key;
    }

    // OAuth 인증 처리
    else if (isOAuth) {
      if (!oauth_access_token) throw new Error('Access token이 없습니다. 로그인 필요.');
      if (oauth_token_expires_at && new Date() >= new Date(oauth_token_expires_at)) {
        throw new Error('Access token이 만료되었습니다. 다시 로그인 해주세요.');
      }

      this.authToken = oauth_access_token;
      this.authHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    return this;
  }

  // HTTP 요청 실행
  async execute() {
    const url = createURL(this.config.domain, this.path);
    const method = this.config.method.toLowerCase();
    const axios = _axios.create();

    const headers: Record<string, string> = {
      ...this.authHeaders,
      ...(this.config.contentType ? { 'Content-Type': this.config.contentType } : {}),
    };

    const queryParams: Record<string, unknown> = {};
    const bodyParams: Record<string, unknown> = {};

    // 파라미터 위치에 따라 분리
    if (this.config.parameterLocations && this.params) {
      for (const [key, val] of Object.entries(this.params)) {
        const loc = this.config.parameterLocations[key] || (method === 'get' ? 'query' : 'body');
        if (loc === 'query') queryParams[key] = val;
        else if (loc === 'header') headers[key] = String(val);
        else if (loc === 'body') bodyParams[key] = val;
      }
    } else {
      Object.assign(queryParams, this.params);
      Object.assign(bodyParams, this.params);
    }

    // HTTP 메서드별 axios 요청
    if (method === 'get') return axios.get(url, { headers, params: queryParams });
    else if (method === 'post') return axios.post(url, bodyParams, { headers, params: queryParams });
    else if (method === 'put') return axios.put(url, bodyParams, { headers, params: queryParams });
    else if (method === 'delete') return axios.delete(url, { headers, data: bodyParams, params: queryParams });
    else if (method === 'patch') return axios.patch(url, bodyParams, { headers, params: queryParams });
    else throw new Error(`지원하지 않는 HTTP 메서드: ${method}`);
  }

  getConfig() {
    return this.config;
  }
}

// API 요청 생성을 위한 래퍼 클래스
export class ActionRequest {
    private config: RequestConfig;
  
    constructor(
      domain: string,
      path: string,
      method: string,
      operation: string,
      isConsequential: boolean,
      contentType: string,
      parameterLocations?: Record<string, 'query' | 'path' | 'header' | 'body'>,
    ) {
      this.config = new RequestConfig(domain, path, method, operation, isConsequential, contentType, parameterLocations);
    }
  
    // Getter 메서드들 - 속성에 접근하기 위한 함수들
    get domain() {
      return this.config.domain;
    }
    get path() {
      return this.config.basePath;
    }
    get method() {
      return this.config.method;
    }
    get operation() {
      return this.config.operation;
    }
    get isConsequential() {
      return this.config.isConsequential;
    }
    get contentType() {
      return this.config.contentType;
    }
  
    // 새로운 요청 실행기를 생성
    createExecutor() {
      return new RequestExecutor(this.config);
    }
  
    // 파라미터 설정 (실행기 반환)
    setParams(params: Record<string, unknown>) {
      const executor = this.createExecutor();
      executor.setParams(params);
      return executor;
    }
  
    // 인증 설정 (실행기 반환)
    async setAuth(metadata: ActionMetadata) {
      const executor = this.createExecutor();
      return executor.setAuth(metadata);
    }
  
    // 요청 실행
    async execute() {
      const executor = this.createExecutor();
      return executor.execute();
    }
  }
  
  // OpenAPI $ref 객체를 실제 참조된 객체로 변환하는 함수
export function resolveRef<
T extends
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3.SchemaObject
  | OpenAPIV3.ParameterObject
  | OpenAPIV3.RequestBodyObject,
>(
obj: T,
components?: OpenAPIV3.ComponentsObject,
): Exclude<T, OpenAPIV3.ReferenceObject> {
if ('$ref' in obj && components) {
  // $ref 경로를 '/' 단위로 분리해서 탐색
  const refPath = obj.$ref.replace(/^#\/components\//, '').split('/');
  let resolved: unknown = components as Record<string, unknown>;

  for (const segment of refPath) {
    if (typeof resolved === 'object' && resolved !== null && segment in resolved) {
      resolved = (resolved as Record<string, unknown>)[segment];
    } else {
      throw new Error(`참조를 해결할 수 없습니다: ${obj.$ref}`);
    }
  }

  // 재귀적으로 최종 참조된 객체 반환
  return resolveRef(resolved as typeof obj, components) as Exclude<T, OpenAPIV3.ReferenceObject>;
}

return obj as Exclude<T, OpenAPIV3.ReferenceObject>;
}

// operationId에서 특수문자 제거
function sanitizeOperationId(input: string) {
    return input.replace(/[^a-zA-Z0-9_-]/g, '');
}
  
/**
 * OpenAPI 명세를 기반으로 함수 시그니처와 API 요청 생성기를 구성하는 함수
 */
export function openapiToFunction(
    openapiSpec: OpenAPIV3.Document,
    generateZodSchemas = false,
  ): {
    functionSignatures: FunctionSignature[];
    requestBuilders: Record<string, ActionRequest>;
    zodSchemas?: Record<string, z.ZodTypeAny>;
  } {
    const functionSignatures: FunctionSignature[] = [];
    const requestBuilders: Record<string, ActionRequest> = {};
    const zodSchemas: Record<string, z.ZodTypeAny> = {};
    const baseUrl = openapiSpec.servers?.[0]?.url ?? ''; // 기본 서버 URL
  
    // 각 path 및 HTTP method 반복
    for (const [path, methods] of Object.entries(openapiSpec.paths)) {
      for (const [method, operation] of Object.entries(methods as OpenAPIV3.PathsObject)) {
        const paramLocations: Record<string, 'query' | 'path' | 'header' | 'body'> = {};
        const operationObj = operation as OpenAPIV3.OperationObject & {
          'x-openai-isConsequential'?: boolean;
          'x-strict'?: boolean;
        };
  
        const defaultOperationId = `${method}_${path}`;
        const operationId = operationObj.operationId || sanitizeOperationId(defaultOperationId);
        const description = operationObj.summary || operationObj.description || '';
        const isStrict = operationObj['x-strict'] ?? false;
  
        // 요청 파라미터 스키마 초기화
        const parametersSchema: OpenAPISchema = {
          type: 'object',
          properties: {},
          required: [],
        };
  
        // URL 파라미터 처리
        if (operationObj.parameters) {
          for (const param of operationObj.parameters) {
            const resolvedParam = resolveRef(param, openapiSpec.components) as OpenAPIV3.ParameterObject;
            const paramName = resolvedParam.name;
            if (!paramName || !resolvedParam.schema) continue;
  
            const paramSchema = resolveRef(resolvedParam.schema, openapiSpec.components);
            parametersSchema.properties[paramName] = paramSchema;
            if (resolvedParam.required) {
              parametersSchema.required.push(paramName);
            }
  
            paramLocations[paramName] = ['query', 'path', 'header', 'body'].includes(resolvedParam.in)
              ? resolvedParam.in as any
              : 'query';
          }
        }
  
        // 요청 바디 처리
        if (operationObj.requestBody) {
          const requestBody = operationObj.requestBody as RequestBodyObject;
          const contentType = Object.keys(requestBody.content ?? {})[0];
          const schema = requestBody.content?.[contentType]?.schema;
  
          const resolvedSchema = resolveRef(schema as any, openapiSpec.components);
          parametersSchema.properties = {
            ...parametersSchema.properties,
            ...resolvedSchema.properties,
          };
          if (resolvedSchema.required) {
            parametersSchema.required.push(...resolvedSchema.required);
          }
  
          // body 파라미터 위치 기록
          for (const key in resolvedSchema.properties) {
            paramLocations[key] = 'body';
          }
        }
  
        // 함수 시그니처 및 요청 객체 생성
        const functionSignature = new FunctionSignature(operationId, description, parametersSchema, isStrict);
        functionSignatures.push(functionSignature);
  
        const actionRequest = new ActionRequest(
          baseUrl,
          path,
          method,
          operationId,
          !!(operationObj['x-openai-isConsequential'] ?? false),
          operationObj.requestBody ? 'application/json' : '',
          paramLocations,
        );
  
        requestBuilders[operationId] = actionRequest;
  
        // Zod 스키마 생성 여부 확인
        if (generateZodSchemas && Object.keys(parametersSchema.properties).length > 0) {
          const schema = openAPISchemaToZod(parametersSchema);
          if (schema) {
            zodSchemas[operationId] = schema;
          }
        }
      }
    }
  
    return { functionSignatures, requestBuilders, zodSchemas };
  }
  
  export type ValidationResult = {
    status: boolean;
    message: string;
    spec?: OpenAPIV3.Document;
  };

  // OpenAPI 스펙 문자열을 검증 및 파싱
export function validateAndParseOpenAPISpec(specString: string): ValidationResult {
    try {
      let parsedSpec;
      try {
        // JSON 또는 YAML 포맷 파싱
        parsedSpec = JSON.parse(specString);
      } catch {
        parsedSpec = load(specString);
      }
  
      // 서버 URL 확인
      if (!parsedSpec.servers || !Array.isArray(parsedSpec.servers) || parsedSpec.servers.length === 0) {
        return { status: false, message: '서버 URL을 찾을 수 없습니다 (`servers` 항목 확인).' };
      }
  
      if (!parsedSpec.servers[0].url) {
        return { status: false, message: '유효한 서버 URL이 없습니다.' };
      }
  
      // paths 존재 여부 확인
      const paths = parsedSpec.paths;
      if (!paths || typeof paths !== 'object' || Object.keys(paths).length === 0) {
        return { status: false, message: 'OpenAPI 스펙에 경로(path)가 없습니다.' };
      }
  
      const components = parsedSpec.components?.schemas || {};
      const messages = [];
  
      // 응답 객체 내 참조 스키마 확인
      for (const [path, methods] of Object.entries(paths)) {
        for (const [httpMethod, operation] of Object.entries(methods as OpenAPIV3.PathItemObject)) {
          const { responses } = operation as OpenAPIV3.OperationObject;
          if (typeof operation === 'object' && responses) {
            for (const [statusCode, response] of Object.entries(responses)) {
              const content = (response as OpenAPIV3.ResponseObject).content as MediaTypeObject;
              const schema = content?.['application/json']?.schema;
              if (schema && '$ref' in schema && typeof schema.$ref === 'string') {
                const refName = schema.$ref.split('/').pop();
                if (refName && !components[refName]) {
                  messages.push(
                    `응답 스키마의 참조된 컴포넌트 ${refName} 이 존재하지 않습니다. 빈 스키마로 대체됩니다.`,
                  );
                }
              }
            }
          }
        }
      }
  
      return {
        status: true,
        message: messages.join('\n') || 'OpenAPI 스펙이 유효합니다.',
        spec: parsedSpec,
      };
    } catch (error) {
      console.error(error);
      return { status: false, message: 'OpenAPI 스펙 파싱 중 오류가 발생했습니다.' };
    }
  }
  