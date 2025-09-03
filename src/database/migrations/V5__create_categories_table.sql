CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(organization_id, name),
    CHECK (
        (is_default = TRUE AND organization_id IS NULL AND created_by IS NULL AND updated_by IS NULL) OR
        (is_default = FALSE AND organization_id IS NOT NULL AND created_by IS NOT NULL AND updated_by IS NOT NULL)
    )
);

INSERT INTO categories (name, description, is_default) VALUES 
('Food & Dining', 'Restaurants, fast food, takeout', TRUE),
('Groceries', 'Food, toiletries, household items', TRUE),
('Transportation', 'Gas, public transit, ride-sharing', TRUE),
('Shopping', 'Clothing, electronics, general retail', TRUE),
('Bills & Utilities', 'Rent, electricity, phone, internet', TRUE),
('Entertainment', 'Movies, concerts, subscriptions, games', TRUE),
('Healthcare', 'Medical, pharmacy, insurance', TRUE),
('Equipment', 'Office supplies, equipment, software', TRUE),
('Packaging', 'Packaging materials, shipping, delivery', TRUE),
('Business', 'Business-related expenses', TRUE),
('Other', 'Miscellaneous expenses', TRUE);
