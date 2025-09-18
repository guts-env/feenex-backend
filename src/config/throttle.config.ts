export const ThrottleNames = {
  DEFAULT: 'default',
  AUTH_STRICT: 'auth-strict',
  AUTH_REGISTER: 'auth-register',
  REQUEST_RESET_PASSWORD: 'request-reset-password',
  RESET_PASSWORD: 'reset-password',
  UPDATE_PASSWORD: 'update-password',
  CREATE_INVITE: 'create-invite',
  INVITE_ACCEPT: 'invite-accept',
  FILE_UPLOAD: 'file-upload',
  AUTO_EXPENSE: 'auto-expense',
  INVITE_CREATE: 'invite-create',
  REPORT_GENERATION: 'report-generation',
} as const;

export const THROTTLE_CONFIG = [
  {
    name: ThrottleNames.DEFAULT,
    ttl: 60 * 1000, // 1 minute
    limit: 100,
  },
  {
    name: ThrottleNames.AUTH_STRICT,
    ttl: 15 * 60 * 1000, // 15 minutes
    limit: 5,
  },
  {
    name: ThrottleNames.AUTH_REGISTER,
    ttl: 60 * 60 * 1000, // 1 hour
    limit: 3,
  },
  {
    name: ThrottleNames.REQUEST_RESET_PASSWORD,
    ttl: 60 * 60 * 1000, // 1 hour
    limit: 3,
  },
  {
    name: ThrottleNames.RESET_PASSWORD,
    ttl: 60 * 60 * 1000, // 1 hour
    limit: 3,
  },
  {
    name: ThrottleNames.UPDATE_PASSWORD,
    ttl: 60 * 60 * 1000, // 1 hour
    limit: 3,
  },
  {
    name: ThrottleNames.CREATE_INVITE,
    ttl: 60 * 1000, // 1 minute
    limit: 10,
  },
  {
    name: ThrottleNames.INVITE_ACCEPT,
    ttl: 60 * 60 * 1000, // 1 hour
    limit: 10,
  },
  {
    name: ThrottleNames.FILE_UPLOAD,
    ttl: 60 * 1000, // 1 minute
    limit: 20,
  },
  {
    name: ThrottleNames.AUTO_EXPENSE,
    ttl: 60 * 1000, // 1 minute
    limit: 20,
  },
  {
    name: ThrottleNames.INVITE_CREATE,
    ttl: 60 * 1000, // 1 minute
    limit: 10,
  },
  {
    name: ThrottleNames.REPORT_GENERATION,
    ttl: 60 * 1000, // 1 minute
    limit: 20,
  },
];

export const ThrottleLimits = THROTTLE_CONFIG.reduce(
  (acc, config) => {
    const key = config.name.toUpperCase().replace(/-/g, '_');
    acc[key] = {
      [config.name]: {
        limit: config.limit,
        ttl: config.ttl,
      },
    };
    return acc;
  },
  {} as Record<string, Record<string, { limit: number; ttl: number }>>,
);
