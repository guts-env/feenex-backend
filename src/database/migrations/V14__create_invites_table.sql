CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (email, organization_id)
);

CREATE INDEX idx_invites_expires_at ON invites(expires_at);
CREATE INDEX idx_invites_used ON invites(used);
CREATE INDEX idx_invites_organization_id ON invites(organization_id);
CREATE INDEX idx_invites_created_by ON invites(created_by);
