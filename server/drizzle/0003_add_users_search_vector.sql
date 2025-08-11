ALTER TABLE users ADD COLUMN search_vector tsvector;

-- Populate existing rows
UPDATE users
SET search_vector = 
    setweight(to_tsvector('simple', coalesce(email, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(first_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(last_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(father_name, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(country, '')), 'C');

-- Add a GIN index for fast search
CREATE INDEX idx_users_search_vector ON users USING gin(search_vector);

CREATE FUNCTION update_users_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.email, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.first_name, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.last_name, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.father_name, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(NEW.country, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_search_vector
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_users_search_vector();