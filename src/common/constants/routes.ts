export const ModuleRoutes = {
  Auth: {
    Main: 'auth',
    Paths: {
      Register: 'register',
      AcceptInvite: 'accept-invite',
      Login: 'login',
      RequestResetPassword: 'request-reset-password',
      ResetPassword: 'reset-password',
      UpdatePassword: 'update-password',
      Refresh: 'refresh',
      Logout: 'logout',
      LogoutAllDevices: 'logout-all',
    },
  },
  AccountPlans: {
    Main: 'account-plans',
    Paths: {
      Organization: 'organization',
    },
  },
  Categories: {
    Main: 'categories',
  },
  Email: {
    Main: 'email',
    Paths: {
      Support: 'support',
    },
  },
  Expenses: {
    Main: 'expenses',
    Paths: {
      Auto: 'auto',
      Verify: 'verify',
      Total: 'total',
    },
  },
  Invites: {
    Main: 'invites',
  },
  Organizations: {
    Main: 'organizations',
    Paths: {
      Members: 'members',
      MemberRole: 'member-role',
    },
  },
  Reports: {
    Main: 'reports',
  },
  Subscriptions: {
    Main: 'subscriptions',
    Paths: {
      Stats: 'stats',
      ActiveBilling: 'active-billing',
      DueForBilling: 'due-for-billing',
    },
  },
  Upload: {
    Main: 'upload',
    Paths: {
      Presigned: 'presigned',
      DownloadPresigned: 'download-presigned',
    },
  },
  Users: {
    Main: 'users',
    Paths: {
      Profile: 'profile',
    },
  },
};
