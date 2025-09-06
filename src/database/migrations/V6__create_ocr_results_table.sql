CREATE TYPE processing_status AS ENUM (
    'pending',
    'processing', 
    'completed',
    'failed'
);

CREATE TABLE ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- OCR output
    ocr_text TEXT,
    entities JSONB,
    
    -- Processing metadata
    status processing_status DEFAULT 'pending',
    confidence_score DECIMAL(5,2),
    error_message TEXT,
    processing_time_ms INTEGER,
    
    -- Image reference
    image_path TEXT NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);