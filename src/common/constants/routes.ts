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
  Categories: {
    Main: 'categories',
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
