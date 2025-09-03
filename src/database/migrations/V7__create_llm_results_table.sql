CREATE TABLE llm_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_result_id UUID NOT NULL REFERENCES ocr_results(id) ON DELETE CASCADE,
    
    -- Raw LLM response
    extracted_data JSONB,
    
    -- Processing metadata
    status processing_status DEFAULT 'pending',
    error_message TEXT,
    processing_time_ms INTEGER,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);