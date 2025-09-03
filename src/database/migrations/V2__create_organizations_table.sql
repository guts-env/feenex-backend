CREATE TYPE organization_type as ENUM (
  'personal',
  'business'
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type organization_type NOT NULL DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
