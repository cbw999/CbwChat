import { z } from 'zod';

/**
 * PermissionTypes 열거형
 */
export enum PermissionTypes {
  PROMPTS = 'PROMPTS',
  BOOKMARKS = 'BOOKMARKS',
  AGENTS = 'AGENTS',
  MULTI_CONVO = 'MULTI_CONVO',
  TEMPORARY_CHAT = 'TEMPORARY_CHAT',
  RUN_CODE = 'RUN_CODE',
  WEB_SEARCH = 'WEB_SEARCH',
}

/**
 * 권한 관련 상수 열거형
 */
export enum Permissions {
  SHARED_GLOBAL = 'SHARED_GLOBAL',
  USE = 'USE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  READ = 'READ',
  READ_AUTHOR = 'READ_AUTHOR',
  SHARE = 'SHARE',
}

export const promptPermissionsSchema = z.object({
  [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
  [Permissions.USE]: z.boolean().default(true),
  [Permissions.CREATE]: z.boolean().default(true),
  // [Permissions.SHARE]: z.boolean().default(false),
});
export type TPromptPermissions = z.infer<typeof promptPermissionsSchema>;

export const bookmarkPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});
export type TBookmarkPermissions = z.infer<typeof bookmarkPermissionsSchema>;

export const agentPermissionsSchema = z.object({
  [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
  [Permissions.USE]: z.boolean().default(true),
  [Permissions.CREATE]: z.boolean().default(true),
  // [Permissions.SHARE]: z.boolean().default(false),
});
export type TAgentPermissions = z.infer<typeof agentPermissionsSchema>;

export const multiConvoPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});
export type TMultiConvoPermissions = z.infer<typeof multiConvoPermissionsSchema>;

export const temporaryChatPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});
export type TTemporaryChatPermissions = z.infer<typeof temporaryChatPermissionsSchema>;

export const runCodePermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});
export type TRunCodePermissions = z.infer<typeof runCodePermissionsSchema>;

export const webSearchPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});
export type TWebSearchPermissions = z.infer<typeof webSearchPermissionsSchema>;

// 모든 권한 타입을 포함하는 통합 스키마
export const permissionsSchema = z.object({
  [PermissionTypes.PROMPTS]: promptPermissionsSchema,
  [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema,
  [PermissionTypes.AGENTS]: agentPermissionsSchema,
  [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema,
  [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema,
  [PermissionTypes.RUN_CODE]: runCodePermissionsSchema,
  [PermissionTypes.WEB_SEARCH]: webSearchPermissionsSchema,
});