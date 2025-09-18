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
];

export const ThrottleLimits = {
  [ThrottleNames.AUTH_STRICT]: {
    [ThrottleNames.AUTH_STRICT]: {
      ttl: 15 * 60 * 1000, // 15 minutes
      limit: 5,
    },
  },
  [ThrottleNames.AUTH_REGISTER]: {
    [ThrottleNames.AUTH_REGISTER]: {
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 3,
    },
  },
  [ThrottleNames.REQUEST_RESET_PASSWORD]: {
    [ThrottleNames.REQUEST_RESET_PASSWORD]: {
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 3,
    },
  },
  [ThrottleNames.RESET_PASSWORD]: {
    [ThrottleNames.RESET_PASSWORD]: {
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 3,
    },
  },
  [ThrottleNames.UPDATE_PASSWORD]: {
    [ThrottleNames.UPDATE_PASSWORD]: {
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 3,
    },
  },
  [ThrottleNames.CREATE_INVITE]: {
    [ThrottleNames.CREATE_INVITE]: {
      ttl: 60 * 1000, // 1 minute
      limit: 10,
    },
  },
  [ThrottleNames.INVITE_ACCEPT]: {
    [ThrottleNames.INVITE_ACCEPT]: {
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 10,
    },
  },
  [ThrottleNames.FILE_UPLOAD]: {
    [ThrottleNames.FILE_UPLOAD]: {
      ttl: 60 * 1000, // 1 minute
      limit: 20,
    },
  },
  [ThrottleNames.AUTO_EXPENSE]: {
    [ThrottleNames.AUTO_EXPENSE]: {
      ttl: 60 * 1000, // 1 minute
      limit: 20,
    },
  },
  [ThrottleNames.INVITE_CREATE]: {
    [ThrottleNames.INVITE_CREATE]: {
      ttl: 60 * 1000, // 1 minute
      limit: 10,
    },
  },
  [ThrottleNames.REPORT_GENERATION]: {
    [ThrottleNames.REPORT_GENERATION]: {
      ttl: 60 * 1000, // 1 minute
      limit: 20,
    },
  },
};
