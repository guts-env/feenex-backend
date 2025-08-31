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
('admin', 'Full organization access'),
('member', 'Basic expense tracking access');

INSERT INTO permissions (name, description, resource, action) VALUES
('create_categories', 'Create organization categories', 'categories', 'create'),
('invite_users', 'Invite users to organization', 'users', 'create'),
('view_all_expenses', 'View all organization expenses', 'expenses', 'read'),
('manage_organization', 'Manage organization settings', 'organizations', 'manage'),
('create_expenses', 'Create expenses', 'expenses', 'create'),
('view_own_expenses', 'View own expenses', 'expenses', 'read'),
('verify_expenses', 'Verify and approve expenses', 'expenses', 'update');

WITH admin_role AS (SELECT id FROM roles WHERE name = 'admin'),
     all_permissions AS (SELECT id FROM permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT admin_role.id, all_permissions.id FROM admin_role, all_permissions;

WITH member_role AS (SELECT id FROM roles WHERE name = 'member'),
     basic_permissions AS (
       SELECT id FROM permissions 
       WHERE name IN ('create_expenses', 'view_own_expenses')
     )
INSERT INTO role_permissions (role_id, permission_id)
SELECT member_role.id, basic_permissions.id FROM member_role, basic_permissions;
