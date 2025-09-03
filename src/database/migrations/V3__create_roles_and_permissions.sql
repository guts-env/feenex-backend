CREATE TYPE permission_resource as ENUM (
    'categories',
    'users',
    'expenses',
    'organizations'
);

CREATE TYPE permission_action as ENUM (
    'create',
    'read',
    'update',
    'delete',
    'manage'
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  resource permission_resource NOT NULL,
  action permission_action NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

INSERT INTO roles (name, description) VALUES 
('personal_admin', 'Personal organization management'),
('business_admin', 'Full organization access'),
('member', 'Basic expense tracking access');

INSERT INTO permissions (name, description, resource, action) VALUES
('create_expenses', 'Create expenses', 'expenses', 'create'),
('view_own_expenses', 'View own expenses', 'expenses', 'read'),
('invite_users', 'Invite users to organization', 'users', 'create'),
('create_categories', 'Create organization categories', 'categories', 'create'),
('view_all_expenses', 'View all organization expenses', 'expenses', 'read'),
('manage_organization', 'Manage organization settings', 'organizations', 'manage'),
('verify_expenses', 'Verify and approve expenses', 'expenses', 'update');

WITH business_admin_role AS (SELECT id FROM roles WHERE name = 'business_admin'),
     all_permissions AS (SELECT id FROM permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT business_admin_role.id, all_permissions.id FROM business_admin_role, all_permissions;

WITH personal_admin_role AS (SELECT id FROM roles WHERE name = 'personal_admin'),
     personal_permissions AS (
       SELECT id FROM permissions 
       WHERE name IN ('create_categories', 'manage_organization', 'create_expenses', 'view_own_expenses', 'verify_expenses')
     )
INSERT INTO role_permissions (role_id, permission_id)
SELECT personal_admin_role.id, personal_permissions.id FROM personal_admin_role, personal_permissions;

WITH member_role AS (SELECT id FROM roles WHERE name = 'member'),
     basic_permissions AS (
       SELECT id FROM permissions 
       WHERE name IN ('create_expenses', 'view_own_expenses')
     )
INSERT INTO role_permissions (role_id, permission_id)
SELECT member_role.id, basic_permissions.id FROM member_role, basic_permissions;
