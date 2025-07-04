// 필요한 타입과 유틸 함수들을 가져옵니다.
import type { ZodError } from 'zod';
import type {
  TAzureGroups,
  TAzureGroupMap,
  TAzureModelGroupMap,
  TValidatedAzureConfig,
  TAzureConfigValidationResult,
} from '../src/config';
import { extractEnvVariable, envVarRegex } from '../src/utils';
import { azureGroupConfigsSchema } from '../src/config';
import { errorsToString } from '../src/parsers';

// 더 이상 사용되지 않는(Deprecated) Azure 관련 환경 변수 목록
export const deprecatedAzureVariables = [
  { key: 'AZURE_OPENAI_DEFAULT_MODEL', description: '기본 모델 설정' },
  { key: 'AZURE_OPENAI_MODELS', description: '모델 설정' },
  { key: 'AZURE_USE_MODEL_AS_DEPLOYMENT_NAME', description: '모델 이름을 배포 이름으로 사용' },
  { key: 'AZURE_API_KEY', description: '하나의 Azure API 키 설정' },
  { key: 'AZURE_OPENAI_API_INSTANCE_NAME', description: '하나의 인스턴스 이름 설정' },
  { key: 'AZURE_OPENAI_API_DEPLOYMENT_NAME', description: '하나의 배포 이름 설정' },
  { key: 'AZURE_OPENAI_API_VERSION', description: '하나의 API 버전 설정' },
  { key: 'AZURE_OPENAI_API_COMPLETIONS_DEPLOYMENT_NAME', description: '완성용 배포 이름 설정' },
  { key: 'AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME', description: '임베딩용 배포 이름 설정' },
  { key: 'PLUGINS_USE_AZURE', description: '플러그인에서 Azure 사용' },
];

// 서로 충돌될 수 있는 환경 변수 목록
export const conflictingAzureVariables = [
  { key: 'INSTANCE_NAME' },
  { key: 'DEPLOYMENT_NAME' },
];

// Azure 그룹 구성을 검증하는 함수
export function validateAzureGroups(configs: TAzureGroups): TAzureConfigValidationResult {
  let isValid = true;
  const modelNames: string[] = [];
  const modelGroupMap: TAzureModelGroupMap = {};
  const groupMap: TAzureGroupMap = {};
  const errors: (ZodError | string)[] = [];

  // 스키마를 통해 configs를 검증
  const result = azureGroupConfigsSchema.safeParse(configs);
  if (!result.success) {
    isValid = false;
    errors.push(errorsToString(result.error.errors));
  } else {
    for (const group of result.data) {
      // 그룹 내부 속성 추출
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

      // 그룹 이름 중복 확인
      if (groupMap[groupName]) {
        errors.push(`중복된 그룹 이름 발견: "${groupName}"`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 서버리스일 경우 baseURL 필수
      if (serverless && !baseURL) {
        errors.push(`그룹 "${groupName}"는 서버리스이지만 "baseURL"이 없습니다.`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 서버리스가 아니면 instanceName 필수
      if (!instanceName && !serverless) {
        errors.push(`그룹 "${groupName}"는 서버리스가 아니므로 "instanceName"이 필요합니다.`);
        return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
      }

      // 그룹 정보 저장
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

      // 모델 정보 처리
      for (const modelName in group.models) {
        modelNames.push(modelName);
        const model = group.models[modelName];

        // 모델 이름 중복 확인
        if (modelGroupMap[modelName]) {
          errors.push(`중복된 모델 이름 발견: "${modelName}"`);
          return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
        }

        if (serverless) {
          // 서버리스이면 최소 정보만 저장
          modelGroupMap[modelName] = { group: groupName };
          continue;
        }

        const groupDeploymentName = group.deploymentName ?? '';
        const groupVersion = group.version ?? '';
        if (typeof model === 'boolean') {
          // boolean 값인 경우 그룹 기본 값 필요
          if (!groupDeploymentName || !groupVersion) {
            errors.push(`모델 "${modelName}"는 배포 이름이나 버전 정보가 부족합니다.`);
            return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
          }
          modelGroupMap[modelName] = { group: groupName };
        } else {
          // 객체인 경우, 모델 자체 값이 없으면 그룹 값 사용
          const modelDeploymentName = model.deploymentName ?? '';
          const modelVersion = model.version ?? '';
          if ((!modelDeploymentName && !groupDeploymentName) || (!modelVersion && !groupVersion)) {
            errors.push(`모델 "${modelName}"에 필수 정보가 없습니다.`);
            return { isValid: false, modelNames, modelGroupMap, groupMap, errors };
          }
          modelGroupMap[modelName] = { group: groupName };
        }
      }
    }
  }

  return { isValid, modelNames, modelGroupMap, groupMap, errors };
}

// Azure 옵션 정의
type AzureOptions = {
  azureOpenAIApiKey: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiDeploymentName?: string;
  azureOpenAIApiVersion?: string;
};

// 모델 이름을 통해 Azure 설정 정보를 구성하는 함수
export function mapModelToAzureConfig({
  modelName,
  modelGroupMap,
  groupMap,
}: Omit<TValidatedAzureConfig, 'modelNames'> & {
  modelName: string;
}): MappedAzureConfig {
  const modelConfig = modelGroupMap[modelName];
  if (!modelConfig) {
    throw new Error(`모델 "${modelName}"이 구성에서 발견되지 않았습니다.`);
  }

  const groupConfig = groupMap[modelConfig.group];
  if (!groupConfig) {
    throw new Error(`모델 "${modelName}"의 그룹 "${modelConfig.group}"이 없습니다.`);
  }

  const instanceName = groupConfig.instanceName ?? '';

  if (!instanceName && groupConfig.serverless !== true) {
    throw new Error(`그룹 "${modelConfig.group}"는 instanceName이 필요합니다.`);
  }

  const baseURL = groupConfig.baseURL ?? '';
  if (groupConfig.serverless === true && !baseURL) {
    throw new Error(`서버리스 그룹 "${modelConfig.group}"에 baseURL이 없습니다.`);
  }

  // 서버리스 설정 처리
  if (groupConfig.serverless === true) {
    const result: MappedAzureConfig = {
      azureOptions: {
        azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ''),
        azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
      },
      baseURL: extractEnvVariable(baseURL),
      serverless: true,
    };

    // 환경 변수 존재 여부 확인
    const apiKeyValue = result.azureOptions.azureOpenAIApiKey;
    if (typeof apiKeyValue === 'string' && envVarRegex.test(apiKeyValue)) {
      throw new Error(`환경 변수 "${apiKeyValue}"가 존재하지 않습니다.`);
    }

    if (groupConfig.additionalHeaders) {
      result.headers = groupConfig.additionalHeaders;
    }

    return result;
  }

  // 일반 (비 서버리스) 모델 설정 처리
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
    throw new Error(`모델 "${modelName}"에 배포 이름이나 버전이 없습니다.`);
  }

  const azureOptions: AzureOptions = {
    azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
    azureOpenAIApiInstanceName: extractEnvVariable(instanceName),
    azureOpenAIApiDeploymentName: extractEnvVariable(deploymentName),
    azureOpenAIApiVersion: extractEnvVariable(version),
  };

  // 환경 변수 유효성 검증
  for (const value of Object.values(azureOptions)) {
    if (typeof value === 'string' && envVarRegex.test(value)) {
      throw new Error(`환경 변수 "${value}"가 존재하지 않습니다.`);
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

// 그룹 이름을 통해 Azure 설정 정보를 구성하는 함수
export function mapGroupToAzureConfig({
  groupName,
  groupMap,
}: {
  groupName: string;
  groupMap: TAzureGroupMap;
}): MappedAzureConfig {
  const groupConfig = groupMap[groupName];
  if (!groupConfig) {
    throw new Error(`그룹 "${groupName}"이 구성에 없습니다.`);
  }

  const instanceName = groupConfig.instanceName ?? '';
  const serverless = groupConfig.serverless ?? false;
  const baseURL = groupConfig.baseURL ?? '';

  if (!instanceName && !serverless) {
    throw new Error(`그룹 "${groupName}"에 instanceName이 필요합니다.`);
  }

  if (serverless && !baseURL) {
    throw new Error(`서버리스 그룹 "${groupName}"에 baseURL이 없습니다.`);
  }

  const models = Object.keys(groupConfig.models);
  if (models.length === 0) {
    throw new Error(`그룹 "${groupName}"에 설정된 모델이 없습니다.`);
  }

  // 첫 번째 모델 기준으로 설정 추론
  const firstModelName = models[0];
  const modelDetails = groupConfig.models[firstModelName];

  const azureOptions: AzureOptions = {
    azureOpenAIApiVersion: extractEnvVariable(groupConfig.version ?? ''),
    azureOpenAIApiKey: extractEnvVariable(groupConfig.apiKey),
    azureOpenAIApiInstanceName: extractEnvVariable(instanceName),
  };

  // 서버리스인 경우 baseURL과 headers 포함
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
      `모델 "${firstModelName}" 또는 그룹 "${groupName}"에 배포 이름/버전 정보가 없습니다.`,
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
