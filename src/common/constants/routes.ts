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
    },
  },
  Users: {
    Main: 'users',
    Paths: {
      Profile: 'profile',
    },
  },
};
