import { z } from 'zod';
import {
  Permissions,
  PermissionTypes,
  permissionsSchema,
  agentPermissionsSchema,
  promptPermissionsSchema,
  runCodePermissionsSchema,
  webSearchPermissionsSchema,
  bookmarkPermissionsSchema,
  multiConvoPermissionsSchema,
  temporaryChatPermissionsSchema,
} from './permissions';

/**
 * 시스템 기본 역할(Enum)
 */
export enum SystemRoles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// 역할 스키마
export const roleSchema = z.object({
  name: z.string(),
  permissions: permissionsSchema,
});

export type TRole = z.infer<typeof roleSchema>;

// 기본 역할 스키마 정의
const defaultRolesSchema = z.object({
  [SystemRoles.ADMIN]: roleSchema.extend({
    name: z.literal(SystemRoles.ADMIN),
    permissions: permissionsSchema.extend({
      [PermissionTypes.PROMPTS]: promptPermissionsSchema.extend({
        [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
      }),
      [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.AGENTS]: agentPermissionsSchema.extend({
        [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
      }),
      [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.RUN_CODE]: runCodePermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.WEB_SEARCH]: webSearchPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
    }),
  }),
  [SystemRoles.USER]: roleSchema.extend({
    name: z.literal(SystemRoles.USER),
    permissions: permissionsSchema,
  }),
});

// 기본 역할 객체
export const roleDefaults = defaultRolesSchema.parse({
  [SystemRoles.ADMIN]: {
    name: SystemRoles.ADMIN,
    permissions: {
      [PermissionTypes.PROMPTS]: {
        [Permissions.SHARED_GLOBAL]: true,
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
      },
      [PermissionTypes.BOOKMARKS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.AGENTS]: {
        [Permissions.SHARED_GLOBAL]: true,
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
      },
      [PermissionTypes.MULTI_CONVO]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.TEMPORARY_CHAT]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.RUN_CODE]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.WEB_SEARCH]: {
        [Permissions.USE]: true,
      },
    },
  },
  [SystemRoles.USER]: {
    name: SystemRoles.USER,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.WEB_SEARCH]: {},
    },
  },
});