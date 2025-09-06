-- Expense source types
CREATE TYPE expense_source AS ENUM (
    'manual',
    'ocr', 
    'import',
    'api'
);

-- Expense status types
CREATE TYPE expense_status AS ENUM (
    'draft',
    'pending',
    'verified',
    'rejected'
);

CREATE TYPE currency_code AS ENUM (
    'PHP',
    'USD',
    'HKD',
    'THB',
    'VND'
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) NOT NULL,
    merchant_name VARCHAR(200) NOT NULL,
    photos TEXT[],
    
    -- Core expense data
    amount DECIMAL(12,2) NOT NULL,
    currency currency_code DEFAULT 'PHP',
    date DATE NOT NULL,
    description TEXT,
    
    -- Line items as JSONB
    items JSONB,
    other_details JSONB,
    
    -- Processing pipeline
    ocr_result_id UUID REFERENCES ocr_results(id),
    llm_result_id UUID REFERENCES llm_results(id),
    
    source expense_source NOT NULL,
    status expense_status DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    import_id UUID REFERENCES imports(id),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);