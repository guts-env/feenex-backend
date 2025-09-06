-- Auth indexes
CREATE INDEX idx_auth_user_id ON auth(user_id);

-- Organizations indexes
CREATE INDEX idx_organizations_type ON organizations(type);

-- User organization indexes
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON user_organizations(organization_id);

-- Permissions indexes
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Categories indexes
CREATE INDEX idx_categories_organization_id ON categories(organization_id);
CREATE INDEX idx_categories_is_default ON categories(is_default);
CREATE INDEX idx_categories_org_default ON categories(organization_id, is_default);

-- OCR results indexes
CREATE INDEX idx_ocr_results_user_id ON ocr_results(user_id);
CREATE INDEX idx_ocr_results_organization_id ON ocr_results(organization_id);
CREATE INDEX idx_ocr_results_status ON ocr_results(status);

-- LLM results indexes
CREATE INDEX idx_llm_results_ocr_result_id ON llm_results(ocr_result_id);
CREATE INDEX idx_llm_results_status ON llm_results(status);

-- Merchants indexes
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);

-- Expenses indexes
CREATE INDEX idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_merchant_name ON expenses(merchant_name);

-- Invites indexes
CREATE INDEX idx_invites_expires_at ON invites(expires_at);
CREATE INDEX idx_invites_used ON invites(used);
CREATE INDEX idx_invites_organization_id ON invites(organization_id);
CREATE INDEX idx_invites_created_by ON invites(created_by);
CREATE INDEX idx_invites_token ON invites(token);

-- Composite indexes for common query patterns
CREATE INDEX idx_expenses_org_user_date ON expenses(organization_id, user_id, date DESC);
CREATE INDEX idx_expenses_org_status_date ON expenses(organization_id, status, date DESC);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_status ON expenses(user_id, status);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
