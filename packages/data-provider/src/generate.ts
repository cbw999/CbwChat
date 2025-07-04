import { z, ZodArray, ZodError, ZodIssueCode } from 'zod';
import { tConversationSchema, googleSettings as google, openAISettings as openAI } from './schemas';
import type { ZodIssue } from 'zod';
import type { TConversation, TSetOption, TPreset } from './schemas';

// Google 설정 타입 (google 객체의 일부 속성만 선택적으로 포함)
export type GoogleSettings = Partial<typeof google>;

// OpenAI 설정 타입 (현재 google 타입을 참조하고 있음. 수정 필요 가능성 있음)
export type OpenAISettings = Partial<typeof google>;

// UI 컴포넌트의 타입 정의
export type ComponentType =
  | 'input'     // 입력 필드
  | 'textarea'  // 여러 줄 텍스트 필드
  | 'slider'    // 슬라이더
  | 'checkbox'  // 체크박스
  | 'switch'    // 스위치 토글
  | 'dropdown'  // 드롭다운 리스트
  | 'combobox'  // 콤보박스
  | 'tags';     // 태그 입력

// 옵션의 유형 정의
export type OptionType = 'conversation' | 'model' | 'custom';

// 옵션 데이터 구조 (레코드 형태, label은 표시용, value는 실제 값)
export type Option = Record<string, unknown> & {
  label?: string;                      // 사용자에게 보여지는 이름
  value: string | number | null;      // 실제 값
};

// 아이콘이 포함된 옵션 타입
export type OptionWithIcon = Option & { icon?: React.ReactNode }; // 아이콘 포함

// 컴포넌트 타입 열거형 (ComponentType 문자열과 동일)
export enum ComponentTypes {
  Input = 'input',
  Textarea = 'textarea',
  Slider = 'slider',
  Checkbox = 'checkbox',
  Switch = 'switch',
  Dropdown = 'dropdown',
  Combobox = 'combobox',
  Tags = 'tags',
}

// 설정값의 데이터 타입 정의
export enum SettingTypes {
  Number = 'number',    // 숫자형
  Boolean = 'boolean',  // 참/거짓
  String = 'string',    // 문자열
  Enum = 'enum',        // 열거형
  Array = 'array',      // 배열
}

// 옵션 타입 열거형 (OptionType과 동일)
export enum OptionTypes {
  Conversation = 'conversation',
  Model = 'model',
  Custom = 'custom',
}

// 하나의 설정 항목 정의
export interface SettingDefinition {
  key: string;                               // 설정 키 (고유 식별자)
  description?: string;                      // 설명 (옵션)
  type: 'number' | 'boolean' | 'string' | 'enum' | 'array'; // 데이터 타입
  default?: number | boolean | string | string[];          // 기본값 (옵션)
  showLabel?: boolean;                       // 라벨 표시 여부
  showDefault?: boolean;                     // 기본값 표시 여부
  options?: string[];                        // 선택 가능한 옵션 목록 (열거형 등)
  range?: SettingRange;                      // 숫자 범위 정보 (슬라이더 등)
  enumMappings?: Record<string, number | boolean | string>; // enum → 실제 값 매핑
  component: ComponentType;                  // 렌더링에 사용할 컴포넌트 유형
  optionType?: OptionType;                   // 옵션 분류 (옵션)
  columnSpan?: number;                       // 열 병합 수 (UI 레이아웃 관련)
  columns?: number;                          // 내부 항목 열 수
  label?: string;                            // 라벨 텍스트
  placeholder?: string;                      // placeholder 텍스트
  labelCode?: boolean;                       // 라벨에 코드 스타일 적용 여부
  placeholderCode?: boolean;                 // placeholder에 코드 스타일 적용 여부
  descriptionCode?: boolean;                 // 설명에 코드 스타일 적용 여부
  minText?: number;                          // 최소 텍스트 길이 (옵션)
  maxText?: number;                          // 최대 텍스트 길이 (옵션)
  minTags?: number;                          // 최소 태그 수 (태그 컴포넌트 전용)
  maxTags?: number;                          // 최대 태그 수 (태그 컴포넌트 전용)
  includeInput?: boolean;                    // 입력 필드 포함 여부 (슬라이더 전용)
  descriptionSide?: 'top' | 'right' | 'bottom' | 'left'; // 설명 위치
  items?: OptionWithIcon[];                  // 항목 목록 (콤보박스 전용)
  searchPlaceholder?: string;                // 검색 필드용 placeholder (콤보박스)
  selectPlaceholder?: string;                // 선택 필드용 placeholder (콤보박스)
  searchPlaceholderCode?: boolean;           // 검색 필드에 코드 스타일 적용 여부
  selectPlaceholderCode?: boolean;           // 선택 필드에 코드 스타일 적용 여부
}

// 설정을 동적으로 주입할 때 사용하는 Props 정의
export type DynamicSettingProps = Partial<SettingDefinition> & {
  readonly?: boolean;                                     // 읽기 전용 여부
  settingKey: string;                                     // 설정 키
  setOption: TSetOption;                                  // 설정 변경 함수
  conversation: Partial<TConversation> | Partial<TPreset> | null; // 대화 또는 프리셋 정보
  defaultValue?: number | boolean | string | string[];    // 초기 기본값
  className?: string;                                     // 외부 클래스명
  inputClassName?: string;                                // 입력 필드 클래스명
};

// 필수 설정 필드 리스트 (key, type, component는 필수)
const requiredSettingFields = ['key', 'type', 'component'];

// 숫자 범위 정의 (슬라이더 등에 사용)
export interface SettingRange {
  min: number;         // 최소값
  max: number;         // 최대값
  step?: number;       // 증가 단위 (옵션)
}

// 전체 설정 구성 배열
export type SettingsConfiguration = SettingDefinition[];

/**
 * 설정 정의 배열을 기반으로 Zod 스키마 객체를 동적으로 생성
 */
export function generateDynamicSchema(settings: SettingsConfiguration) {
    const schemaFields: { [key: string]: z.ZodTypeAny } = {};
  
    for (const setting of settings) {
      const {
        key,
        type,
        default: defaultValue,
        range,
        options,
        minText,
        maxText,
        minTags,
        maxTags,
      } = setting;
  
      // 숫자형 타입 처리
      if (type === SettingTypes.Number) {
        let schema = z.number();
        if (range) {
          schema = schema.min(range.min);
          schema = schema.max(range.max);
        }
        schemaFields[key] = typeof defaultValue === 'number' ? schema.default(defaultValue) : schema;
        continue;
      }
  
      // 불리언 타입 처리
      if (type === SettingTypes.Boolean) {
        const schema = z.boolean();
        schemaFields[key] = typeof defaultValue === 'boolean' ? schema.default(defaultValue) : schema;
        continue;
      }
  
      // 문자열 타입 처리
      if (type === SettingTypes.String) {
        let schema = z.string();
        if (minText) schema = schema.min(minText);
        if (maxText) schema = schema.max(maxText);
        schemaFields[key] = typeof defaultValue === 'string' ? schema.default(defaultValue) : schema;
        continue;
      }
  
      // 열거형(enum) 타입 처리
      if (type === SettingTypes.Enum) {
        if (!options || options.length === 0) {
          console.warn(`열거형 설정 '${key}'에 'options'가 없습니다.`);
          continue;
        }
        const schema = z.enum(options as [string, ...string[]]);
        schemaFields[key] = typeof defaultValue === 'string' ? schema.default(defaultValue) : schema;
        continue;
      }
  
      // 배열 타입 처리
      if (type === SettingTypes.Array) {
        let schema: z.ZodSchema = z.array(z.string().or(z.number()));
        if (minTags) schema = schema.min(minTags);
        if (maxTags) schema = schema.max(maxTags);
        if (Array.isArray(defaultValue)) schema = schema.default(defaultValue);
        schemaFields[key] = schema;
        continue;
      }
  
      // 알 수 없는 타입인 경우 경고 출력
      console.warn(`지원되지 않는 설정 타입: ${type}`);
    }
  
    return z.object(schemaFields); // Zod 스키마 객체 반환
  }
  
  // Zod 타입명을 설정 타입으로 매핑
  const ZodTypeToSettingType: Record<string, string | undefined> = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
  };
  
  // 설정값 관련 상수 정의
  const minColumns = 1;
  const maxColumns = 4;
  const minSliderOptions = 2;
  const minDropdownOptions = 2;
  const minComboboxOptions = 2;
  
  /**
   * 설정 정의 배열의 유효성을 검사하고 필요한 기본값을 자동 설정
   * 오류 발생 시 ZodIssue 리스트에 추가됨
   */
  export function validateSettingDefinitions(settings: SettingsConfiguration): void {
    const errors: ZodIssue[] = [];
  
    // 열 수 검증
    const columnsSet = new Set<number>();
    for (const setting of settings) {
      if (setting.columns !== undefined) {
        if (setting.columns < minColumns || setting.columns > maxColumns) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `설정 ${setting.key}의 columns 값은 ${minColumns}~${maxColumns} 사이여야 합니다.`,
            path: ['columns'],
          });
        } else {
          columnsSet.add(setting.columns);
        }
      }
    }
  
    const columns = columnsSet.size === 1 ? columnsSet.values().next().value : 2;
  
    for (const setting of settings) {
      // 필수 필드 존재 여부 확인
      for (const field of requiredSettingFields) {
        if (setting[field as keyof SettingDefinition] === undefined) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `설정 ${setting.key}에 필수 필드 ${field}가 없습니다.`,
            path: [field],
          });
        }
      }
  
      // 타입 유효성 검증
      const settingTypes = Object.values(SettingTypes);
      if (!settingTypes.includes(setting.type as SettingTypes)) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 타입이 유효하지 않습니다. 가능한 타입: ${settingTypes.join(', ')}`,
          path: ['type'],
        });
      }
  
      // 태그 컴포넌트는 반드시 Array 타입이어야 함
      if (
        (setting.component === ComponentTypes.Tags && setting.type !== SettingTypes.Array) ||
        (setting.component !== ComponentTypes.Tags && setting.type === SettingTypes.Array)
      ) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}: 태그 컴포넌트는 반드시 배열 타입이어야 합니다.`,
          path: ['type'],
        });
      }
  
      // 태그 컴포넌트 전용 검증
      if (setting.component === ComponentTypes.Tags) {
        if (setting.minTags !== undefined && setting.minTags < 0) {
          errors.push({ code: ZodIssueCode.custom, message: `minTags는 0 이상이어야 합니다.`, path: ['minTags'] });
        }
        if (setting.maxTags !== undefined && setting.maxTags < 0) {
          errors.push({ code: ZodIssueCode.custom, message: `maxTags는 0 이상이어야 합니다.`, path: ['maxTags'] });
        }
        if (setting.default && !Array.isArray(setting.default)) {
          errors.push({ code: ZodIssueCode.custom, message: `기본값은 배열이어야 합니다.`, path: ['default'] });
        }
        if (setting.default && setting.maxTags && (setting.default as []).length > setting.maxTags) {
          errors.push({ code: ZodIssueCode.custom, message: `기본값은 최대 ${setting.maxTags}개 이하의 태그여야 합니다.`, path: ['default'] });
        }
        if (setting.default && setting.minTags && (setting.default as []).length < setting.minTags) {
          errors.push({ code: ZodIssueCode.custom, message: `기본값은 최소 ${setting.minTags}개 이상의 태그여야 합니다.`, path: ['default'] });
        }
        if (!setting.default) {
          setting.default = []; // 기본값 미지정 시 빈 배열 할당
        }
      }
  
      // 입력창 및 텍스트영역 검증
      if (
        setting.component === ComponentTypes.Input ||
        setting.component === ComponentTypes.Textarea
      ) {
        if (setting.type === SettingTypes.Number && setting.component === ComponentTypes.Textarea) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `Textarea는 문자열 타입만 사용할 수 있습니다.`,
            path: ['type'],
          });
        }
        if (setting.minText !== undefined && setting.maxText !== undefined && setting.minText > setting.maxText) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `minText는 maxText보다 클 수 없습니다.`,
            path: [setting.key, 'minText', 'maxText'],
          });
        }
        if (!setting.placeholder) {
          setting.placeholder = ''; // 기본 placeholder 설정
        }
      }
  
      // 슬라이더 컴포넌트 검증
      if (setting.component === ComponentTypes.Slider) {
        if (setting.type === SettingTypes.Number && !setting.range) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `숫자 타입 슬라이더에는 range가 필요합니다.`,
            path: ['range'],
          });
        }
        if (setting.type === SettingTypes.Enum && (!setting.options || setting.options.length < minSliderOptions)) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `enum 타입 슬라이더는 최소 ${minSliderOptions}개의 옵션이 필요합니다.`,
            path: ['options'],
          });
        }
  
        setting.includeInput =
          setting.type === SettingTypes.Number ? (setting.includeInput ?? true) : false;
  
        if (setting.default === undefined && setting.range) {
          setting.default = Math.round((setting.range.min + setting.range.max) / 2); // 기본값 자동 계산
        }
      }
  
      // 체크박스 및 스위치: 옵션이 2개를 초과하면 오류
      if (
        setting.component === ComponentTypes.Checkbox ||
        setting.component === ComponentTypes.Switch
      ) {
        if (setting.options && setting.options.length > 2) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `Checkbox 또는 Switch는 최대 2개의 옵션만 허용됩니다.`,
            path: ['options'],
          });
        }
        if (!setting.default && setting.type === SettingTypes.Boolean) {
          setting.default = false; // 기본값 false 설정
        }
      }
  
      // 드롭다운 옵션 검증
      if (setting.component === ComponentTypes.Dropdown) {
        if (!setting.options || setting.options.length < minDropdownOptions) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `Dropdown은 최소 ${minDropdownOptions}개의 옵션이 필요합니다.`,
            path: ['options'],
          });
        }
        if (!setting.default && setting.options && setting.options.length > 0) {
          setting.default = setting.options[0]; // 첫 번째 옵션을 기본값으로 설정
        }
      }
  
      // 콤보박스 옵션 검증
      if (setting.component === ComponentTypes.Combobox) {
        if (!setting.options || setting.options.length < minComboboxOptions) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `Combobox는 최소 ${minComboboxOptions}개의 옵션이 필요합니다.`,
            path: ['options'],
          });
        }
        if (!setting.default && setting.options && setting.options.length > 0) {
          setting.default = setting.options[0]; // 첫 번째 옵션을 기본값으로 설정
        }
      }
  
      // 기본 columnSpan 값 설정
      if (!setting.columnSpan) {
        setting.columnSpan = Math.floor((columns ?? 0) / 2);
      }
  
      // 라벨이 없을 경우 key를 라벨로 사용
      if (!setting.label) {
        setting.label = setting.key;
      }
  
      // min/max 텍스트 길이 유효성 확인
      if (
        setting.component === ComponentTypes.Input ||
        setting.component === ComponentTypes.Textarea
      ) {
        if (setting.minText !== undefined && setting.minText < 0) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `minText는 0 이상이어야 합니다.`,
            path: ['minText'],
          });
        }
        if (setting.maxText !== undefined && setting.maxText < 0) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `maxText는 0 이상이어야 합니다.`,
            path: ['maxText'],
          });
        }
      }
  
      // optionType이 custom이 아닌 경우 tConversationSchema와 타입 일치 여부 확인
      if (setting.optionType !== OptionTypes.Custom) {
        const conversationSchema =
          tConversationSchema.shape[setting.key as keyof Omit<TConversation, 'disableParams'>];
        if (!conversationSchema) {
          errors.push({
            code: ZodIssueCode.custom,
            message: `optionType이 "${setting.optionType}"인 설정 ${setting.key}는 tConversationSchema에 정의되어 있어야 합니다.`,
            path: ['optionType'],
          });
        } else {
          const zodType = conversationSchema._def.typeName;
          const settingTypeEquivalent = ZodTypeToSettingType[zodType] || null;
          if (settingTypeEquivalent !== setting.type) {
            errors.push({
              code: ZodIssueCode.custom,
              message: `optionType "${setting.optionType}"을 가진 설정 ${setting.key}는 tConversationSchema에 정의된 타입과 일치해야 합니다.`,
              path: ['optionType'],
            });
          }
        }
      }

          /* 기본값 유효성 검사 */

    // 숫자 타입의 기본값이 숫자가 아니거나 NaN인 경우
    if (setting.type === SettingTypes.Number && isNaN(setting.default as number) && setting.default != null) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 기본값이 유효하지 않습니다. 숫자여야 합니다.`,
          path: ['default'],
        });
      }
  
      // 불리언 타입인데 기본값이 boolean이 아닌 경우
      if (setting.type === SettingTypes.Boolean && typeof setting.default !== 'boolean' && setting.default != null) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 기본값이 유효하지 않습니다. true 또는 false여야 합니다.`,
          path: ['default'],
        });
      }
  
      // 문자열 또는 열거형(enum) 타입인데 기본값이 문자열이 아닌 경우
      if (
        (setting.type === SettingTypes.String || setting.type === SettingTypes.Enum) &&
        typeof setting.default !== 'string' &&
        setting.default != null
      ) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 기본값이 유효하지 않습니다. 문자열이어야 합니다.`,
          path: ['default'],
        });
      }
  
      // 열거형(enum) 타입의 기본값이 설정된 옵션 목록에 없는 경우
      if (
        setting.type === SettingTypes.Enum &&
        setting.options &&
        !setting.options.includes(setting.default as string)
      ) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 기본값이 유효하지 않습니다. 다음 옵션 중 하나여야 합니다: [${setting.options.join(', ')}].`,
          path: ['default'],
        });
      }
  
      // 숫자 타입의 기본값이 지정된 범위(min/max)를 벗어나는 경우
      if (
        setting.type === SettingTypes.Number &&
        setting.range &&
        typeof setting.default === 'number' &&
        (setting.default < setting.range.min || setting.default > setting.range.max)
      ) {
        errors.push({
          code: ZodIssueCode.custom,
          message: `설정 ${setting.key}의 기본값은 지정된 범위 [${setting.range.min}, ${setting.range.max}] 내에 있어야 합니다.`,
          path: ['default'],
        });
      }
    }
  
    // 오류가 하나라도 있는 경우 예외 발생
    if (errors.length > 0) {
      throw new ZodError(errors);
    }
  }  
   
  /**
 * OpenAI 설정에 기반한 대화 스키마를 생성합니다.
 * 사용자 정의 설정(customOpenAI)을 기반으로 기본값을 덮어씌운 후,
 * tConversationSchema에서 필요한 필드만 선택하여 스키마를 생성합니다.
 */
export const generateOpenAISchema = (customOpenAI: OpenAISettings) => {
    // 기본값 병합: 기본 OpenAI 설정 + 사용자 설정
    const defaults = { ...openAI, ...customOpenAI };
  
    return tConversationSchema
      .pick({
        model: true,                // 모델명
        chatGptLabel: true,         // ChatGPT 라벨
        promptPrefix: true,         // 프롬프트 앞부분 텍스트
        temperature: true,          // 온도 (창의성)
        top_p: true,                // top-p 샘플링
        presence_penalty: true,     // 주제 중복 방지 점수
        frequency_penalty: true,    // 반복 방지 점수
        resendFiles: true,          // 파일 재전송 여부
        imageDetail: true,          // 이미지 상세도
        maxContextTokens: true,     // 최대 컨텍스트 토큰 수
      })
      .transform((obj) => ({
        // 필드가 undefined일 경우 기본값으로 대체
        ...obj,
        model: obj.model ?? defaults.model.default,
        chatGptLabel: obj.chatGptLabel ?? null,
        promptPrefix: obj.promptPrefix ?? null,
        temperature: obj.temperature ?? defaults.temperature.default,
        top_p: obj.top_p ?? defaults.top_p.default,
        presence_penalty: obj.presence_penalty ?? defaults.presence_penalty.default,
        frequency_penalty: obj.frequency_penalty ?? defaults.frequency_penalty.default,
        resendFiles:
          typeof obj.resendFiles === 'boolean' ? obj.resendFiles : defaults.resendFiles.default,
        imageDetail: obj.imageDetail ?? defaults.imageDetail.default,
        maxContextTokens: obj.maxContextTokens ?? undefined,
      }))
      .catch(() => ({
        // 변환 중 오류 발생 시 fallback 기본값 반환
        model: defaults.model.default,
        chatGptLabel: null,
        promptPrefix: null,
        temperature: defaults.temperature.default,
        top_p: defaults.top_p.default,
        presence_penalty: defaults.presence_penalty.default,
        frequency_penalty: defaults.frequency_penalty.default,
        resendFiles: defaults.resendFiles.default,
        imageDetail: defaults.imageDetail.default,
        maxContextTokens: undefined,
      }));
  };
  
  /**
   * Google 설정에 기반한 대화 스키마를 생성합니다.
   * 사용자 정의 설정(customGoogle)을 기반으로 기본값을 덮어씌운 후,
   * tConversationSchema에서 필요한 필드만 선택하여 스키마를 생성합니다.
   */
  export const generateGoogleSchema = (customGoogle: GoogleSettings) => {
    // 기본값 병합: 기본 Google 설정 + 사용자 설정
    const defaults = { ...google, ...customGoogle };
  
    return tConversationSchema
      .pick({
        model: true,                // 모델명
        modelLabel: true,           // 사용자 지정 모델 라벨
        promptPrefix: true,         // 프롬프트 앞부분 텍스트
        examples: true,             // 예시 입력/출력
        temperature: true,          // 온도 (창의성)
        maxOutputTokens: true,      // 최대 출력 토큰 수
        topP: true,                 // top-p 샘플링
        topK: true,                 // top-k 샘플링
        maxContextTokens: true,     // 최대 컨텍스트 토큰 수
      })
      .transform((obj) => {
        return {
          // 필드가 undefined일 경우 기본값으로 대체
          ...obj,
          model: obj.model ?? defaults.model.default,
          modelLabel: obj.modelLabel ?? null,
          promptPrefix: obj.promptPrefix ?? null,
          examples: obj.examples ?? [{ input: { content: '' }, output: { content: '' } }],
          temperature: obj.temperature ?? defaults.temperature.default,
          maxOutputTokens: obj.maxOutputTokens ?? defaults.maxOutputTokens.default,
          topP: obj.topP ?? defaults.topP.default,
          topK: obj.topK ?? defaults.topK.default,
          maxContextTokens: obj.maxContextTokens ?? undefined,
        };
      })
      .catch(() => ({
        // 변환 중 오류 발생 시 fallback 기본값 반환
        model: defaults.model.default,
        modelLabel: null,
        promptPrefix: null,
        examples: [{ input: { content: '' }, output: { content: '' } }],
        temperature: defaults.temperature.default,
        maxOutputTokens: defaults.maxOutputTokens.default,
        topP: defaults.topP.default,
        topK: defaults.topK.default,
        maxContextTokens: undefined,
      }));
  };
  