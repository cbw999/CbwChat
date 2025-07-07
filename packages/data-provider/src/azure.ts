// Zod 라이브러리의 에러 타입을 임포트
import type { ZodError } from 'zod';

// Azure 관련 타입들을 임포트
import type {
  TAzureGroups,
  TAzureGroupMap,
  TAzureModelGroupMap,
  TValidatedAzureConfig,
  TAzureConfigValidationResult,
} from './config';

// 환경변수 추출 유틸리티 및 정규식 임포트
import { extractEnvVariable, envVarRegex } from './utils';

// Azure 그룹 설정을 검증하는 스키마
import { azureGroupConfigsSchema } from './config';

// 에러 객체를 문자열로 변환하는 함수
import { errorsToString } from './parsers';

// 더 이상 사용되지 않는 Azure 관련 환경변수 목록
export const deprecatedAzureVariables = [
  { key: 'AZURE_OPENAI_DEFAULT_MODEL', description: '기본 모델 설정' },
  { key: 'AZURE_OPENAI_MODELS', description: '모델 목록 설정' },
  { key: 'AZURE_USE_MODEL_AS_DEPLOYMENT_NAME', description: '모델명을 배포명으로 사용' },
  { key: 'AZURE_API_KEY', description: '단일 Azure API 키 설정' },
  { key: 'AZURE_OPENAI_API_INSTANCE_NAME', description: '단일 인스턴스 이름 설정' },
  { key: 'AZURE_OPENAI_API_DEPLOYMENT_NAME', description: '단일 배포 이름 설정' },
  { key: 'AZURE_OPENAI_API_VERSION', description: '단일 API 버전 설정' },
  { key: 'AZURE_OPENAI_API_COMPLETIONS_DEPLOYMENT_NAME', description: 'completions 배포 이름 설정' },
  { key: 'AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME', description: 'embeddings 배포 이름 설정' },
  { key: 'PLUGINS_USE_AZURE', description: 'Plugins에 Azure 사용' },
];

// 충돌 가능성이 있는 환경변수 목록
export const conflictingAzureVariables = [
  { key: 'INSTANCE_NAME' },
  { key: 'DEPLOYMENT_NAME' },
];

// Azure 그룹 설정을 검증하는 함수
export function validateAzureGroups(configs: TAzureGroups): TAzureConfigValidationResult {
  let isValid = true;
  const modelNames: string[] = [];
  const modelGroupMap: TAzureModelGroupMap = {};
  const groupMap: TAzureGroupMap = {};
  const errors: (ZodError | string)[] = [];

  const result = azureGroupConfigsSchema.safeParse(configs);

  if (!result.success) {
    // 스키마 검증 실패 시 에러 저장
    isValid = false;
    errors.push(errorsToString(result.error.errors));
  } else {
    for (const group of result.data) {
      // 각 그룹의 필드 구조 분해
      const {
        group: groupName,
        apiKey,
        instanceName = '',
        deploymentName = '',
        version = '',
        baseURL = '',
        additionalHeaders,
        models,
        serverless = false,
        ...rest
      } = group;

      // 그룹 이름 중복 체크
      if (groupMap[groupName]) {
        errors.push(`중복된 그룹 이름: "${groupName}". 그룹 이름은 고유해야 합니다.`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 서버리스일 경우 baseURL 필수
      if (serverless && !baseURL) {
        errors.push(`서버리스 그룹 "${groupName}"에는 "baseURL"이 필요합니다.`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 서버리스가 아닐 경우 instanceName 필수
      if (!instanceName && !serverless) {
        errors.push(`그룹 "${groupName}"는 서버리스가 아니므로 "instanceName"이 필요합니다.`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 그룹 저장
      groupMap[groupName] = {
        apiKey,
        instanceName,
        deploymentName,
        version,
        baseURL,
        additionalHeaders,
        models,
        serverless,
        ...rest,
      };

      // 모델 처리
      for (const modelName in group.models) {
        modelNames.push(modelName);
        const model = group.models[modelName];

        // 모델 이름 중복 체크
        if (modelGroupMap[modelName]) {
          errors.push(`중복된 모델 이름: "${modelName}". 모델 이름은 고유해야 합니다.`);
          return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
        }

        if (serverless) {
          modelGroupMap[modelName] = { group: groupName };
          continue;
        }

        const groupDeploymentName = group.deploymentName ?? '';
        const groupVersion = group.version ?? '';

        if (typeof model === 'boolean') {
          // boolean으로 지정된 모델은 그룹 수준의 설정 필수
          if (!groupDeploymentName || !groupVersion) {
            errors.push(`모델 "${modelName}"는 배포명이나 버전이 누락되었습니다.`);
            return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
          }

          modelGroupMap[modelName] = { group: groupName };
        } else {
          const modelDeploymentName = model.deploymentName ?? '';
          const modelVersion = model.version ?? '';

          // 개별 모델 설정이 없을 경우 그룹 설정을 이용
          if ((!modelDeploymentName && !groupDeploymentName) || (!modelVersion && !groupVersion)) {
            errors.push(`모델 "${modelName}"는 배포명 또는 버전이 누락되었습니다.`);
            return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
          }

          modelGroupMap[modelName] = { group: groupName };
        }
      }
    }
  }

  return { isValid, modelNames, modelGroupMap, groupMap, errors };
}

// Azure 설정 타입 정의
type AzureOptions = {
  azureOpenAIApiKey: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiDeploymentName?: string;
  azureOpenAIApiVersion?: string;
};

// 매핑된 Azure 설정 타입
type MappedAzureConfig = {
  azureOptions: AzureOptions;
  baseURL?: string;
  headers?: Record<string, string>;
  serverless?: boolean;
};

// 모델 이름으로 Azure 설정을 매핑하는 함수
export function mapModelToAzureConfig({
  modelName,
  modelGroupMap,
  groupMap,
}: Omit<TValidatedAzureConfig, 'modelNames'> & {
  modelName: string;
}): MappedAzureConfig {
  const modelConfig = modelGroupMap[modelName];
  if (!modelConfig) {
    throw new Error(`모델 "${modelName}"를 찾을 수 없습니다.`);
  }

  const groupConfig = groupMap[modelConfig.group];
  if (!groupConfig) {
    throw new Error(`모델 "${modelName}"에 대한 그룹 "${modelConfig.group}" 설정이 없습니다.`);
  }

  const instanceName = groupConfig.instanceName ?? '';
  const baseURL = groupConfig.baseURL ?? '';

  // 서버리스 설정인 경우
  if (groupConfig.serverless === true) {
    if (!baseURL) {
      throw new Error(`서버리스 그룹 "${modelConfig.group}"에 baseURL이 없습니다.`);
    }

    const result: MappedAzureConfig = {
      azureOptions: {
        azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ''),
        azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
      },
      baseURL: extractEnvVariable(baseURL),
      serverless: true,
    };

    // 환경 변수 유효성 검사
    const apiKeyValue = result.azureOptions.azureOpenAIApiKey;
    if (typeof apiKeyValue === 'string' && envVarRegex.test(apiKeyValue)) {
      throw new Error(`환경변수 "${apiKeyValue}"가 존재하지 않습니다.`);
    }

    if (groupConfig.additionalHeaders) {
      result.headers = groupConfig.additionalHeaders;
    }

    return result;
  }

  // 일반(non-serverless) 설정
  if (!instanceName) {
    throw new Error(`그룹 "${modelConfig.group}"에 instanceName이 없습니다.`);
  }

  const modelDetails = groupConfig.models[modelName];
  const { deploymentName = '', version = '' } =
    typeof modelDetails === 'object'
      ? {
          deploymentName: modelDetails.deploymentName ?? groupConfig.deploymentName,
          version: modelDetails.version ?? groupConfig.version,
        }
      : {
          deploymentName: groupConfig.deploymentName,
          version: groupConfig.version,
        };

  if (!deploymentName || !version) {
    throw new Error(
      `모델 "${modelName}"의 배포명("${deploymentName}") 또는 버전("${version}")이 누락되었습니다.`,
    );
  }

  const azureOptions: AzureOptions = {
    azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
    azureOpenAIApiInstanceName: extractEnvVariable(instanceName),
    azureOpenAIApiDeploymentName: extractEnvVariable(deploymentName),
    azureOpenAIApiVersion: extractEnvVariable(version),
  };

  for (const value of Object.values(azureOptions)) {
    if (typeof value === 'string' && envVarRegex.test(value)) {
      throw new Error(`환경변수 "${value}"가 존재하지 않습니다.`);
    }
  }

  const result: MappedAzureConfig = { azureOptions };

  if (baseURL) {
    result.baseURL = extractEnvVariable(baseURL);
  }

  if (groupConfig.additionalHeaders) {
    result.headers = groupConfig.additionalHeaders;
  }

  return result;
}

// 그룹 이름으로 Azure 설정을 매핑하는 함수
export function mapGroupToAzureConfig({
  groupName,
  groupMap,
}: {
  groupName: string;
  groupMap: TAzureGroupMap;
}): MappedAzureConfig {
  const groupConfig = groupMap[groupName];
  if (!groupConfig) {
    throw new Error(`그룹 "${groupName}"를 찾을 수 없습니다.`);
  }

  const instanceName = groupConfig.instanceName ?? '';
  const serverless = groupConfig.serverless ?? false;
  const baseURL = groupConfig.baseURL ?? '';

  if (!instanceName && !serverless) {
    throw new Error(`그룹 "${groupName}"에 instanceName이 없습니다.`);
  }

  if (serverless && !baseURL) {
    throw new Error(`서버리스 그룹 "${groupName}"에 baseURL이 없습니다.`);
  }

  const models = Object.keys(groupConfig.models);
  if (models.length === 0) {
    throw new Error(`그룹 "${groupName}"에 설정된 모델이 없습니다.`);
  }

  const firstModelName = models[0];
  const modelDetails = groupConfig.models[firstModelName];

  const azureOptions: AzureOptions = {
    azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ''),
    azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
    azureOpenAIApiInstanceName: extractEnvVariable(instanceName),
  };

  if (serverless) {
    return {
      azureOptions,
      baseURL: extractEnvVariable(baseURL),
      serverless: true,
      ...(groupConfig.additionalHeaders && { headers: groupConfig.additionalHeaders }),
    };
  }

  const { deploymentName = '', version = '' } =
    typeof modelDetails === 'object'
      ? {
          deploymentName: modelDetails.deploymentName ?? groupConfig.deploymentName,
          version: modelDetails.version ?? groupConfig.version,
        }
      : {
          deploymentName: groupConfig.deploymentName,
          version: groupConfig.version,
        };

  if (!deploymentName || !version) {
    throw new Error(
      `모델 "${firstModelName}" 또는 그룹 "${groupName}"의 배포명/버전이 누락되었습니다.`,
    );
  }

  azureOptions.azureOpenAIApiDeploymentName = extractEnvVariable(deploymentName);
  azureOptions.azureOpenAIApiVersion = extractEnvVariable(version);

  const result: MappedAzureConfig = { azureOptions };

  if (baseURL) {
    result.baseURL = extractEnvVariable(baseURL);
  }

  if (groupConfig.additionalHeaders) {
    result.headers = groupConfig.additionalHeaders;
  }

  return result;
}
