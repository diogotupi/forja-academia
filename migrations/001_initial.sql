CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE grant_resource_type AS ENUM ('COURSE', 'EBOOK', 'ALL_ACCESS');
CREATE TYPE grant_source AS ENUM ('SUBSCRIPTION', 'WORKSHOP', 'ADMIN', 'PROMOTION', 'PURCHASE', 'OTHER');
CREATE TYPE grant_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'PENDING');
CREATE TYPE subscription_status AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ENDED');
CREATE TYPE benefit_status AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE duration_unit AS ENUM ('DAYS', 'LIFETIME', 'CUSTOM_DATE');
CREATE TYPE purchase_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);
CREATE INDEX users_name_idx ON users (lower(name));
CREATE INDEX users_phone_idx ON users (phone);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL,
  thumbnail text,
  instructor text NOT NULL,
  category text NOT NULL,
  level text NOT NULL,
  status content_status NOT NULL DEFAULT 'DRAFT',
  included_in_all_access boolean NOT NULL DEFAULT false,
  stripe_price_id text UNIQUE,
  monthly_price_cents integer CHECK (monthly_price_cents IS NULL OR monthly_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX courses_catalog_idx ON courses(status, category);

CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_provider text,
  video_id text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  position integer NOT NULL,
  status content_status NOT NULL DEFAULT 'DRAFT',
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lessons_course_position_unique UNIQUE(course_id, position)
);
CREATE INDEX lessons_course_idx ON lessons(course_id, status, position);

CREATE TABLE ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  author text NOT NULL,
  cover_url text,
  storage_key text,
  status content_status NOT NULL DEFAULT 'DRAFT',
  is_free boolean NOT NULL DEFAULT false,
  included_in_all_access boolean NOT NULL DEFAULT false,
  stripe_price_id text UNIQUE,
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type grant_resource_type NOT NULL,
  resource_id uuid,
  source grant_source NOT NULL,
  source_reference text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status grant_status NOT NULL DEFAULT 'ACTIVE',
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grants_resource_shape CHECK (
    (resource_type = 'ALL_ACCESS' AND resource_id IS NULL) OR
    (resource_type IN ('COURSE', 'EBOOK') AND resource_id IS NOT NULL)
  )
);
CREATE INDEX grants_access_idx ON access_grants(user_id, resource_type, resource_id, status, starts_at, expires_at);
CREATE INDEX grants_source_idx ON access_grants(source, source_reference);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type grant_resource_type NOT NULL,
  resource_id uuid,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_price_id text NOT NULL,
  status subscription_status NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON subscriptions(user_id, status);

CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  payment_mode text NOT NULL CHECK (payment_mode IN ('payment', 'subscription')),
  resource_type grant_resource_type,
  resource_id uuid,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  offer_id uuid NOT NULL REFERENCES offers(id),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  amount_cents integer,
  currency text NOT NULL DEFAULT 'brl',
  status purchase_status NOT NULL DEFAULT 'PENDING',
  customer_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  stripe_price_id text UNIQUE,
  status campaign_status NOT NULL DEFAULT 'DRAFT',
  selectable_course_count integer NOT NULL DEFAULT 1 CHECK (selectable_course_count > 0),
  duration_unit duration_unit NOT NULL DEFAULT 'DAYS',
  duration_value integer,
  custom_expires_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaign_eligible_courses (
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY(campaign_id, course_id)
);

CREATE TABLE campaign_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  purchase_id uuid REFERENCES purchases(id),
  user_id uuid REFERENCES users(id),
  recipient_email text NOT NULL,
  status benefit_status NOT NULL DEFAULT 'PENDING',
  selectable_course_count integer NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_purchase_unique UNIQUE(campaign_id, purchase_id)
);
CREATE INDEX campaign_benefit_lookup_idx ON campaign_benefits(lower(recipient_email), status);

CREATE TABLE benefit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id uuid NOT NULL REFERENCES campaign_benefits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  access_grant_id uuid NOT NULL UNIQUE REFERENCES access_grants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT benefit_course_unique UNIQUE(benefit_id, course_id)
);

CREATE TABLE lesson_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  position_seconds integer NOT NULL DEFAULT 0 CHECK(position_seconds >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, lesson_id)
);

CREATE TABLE processed_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_sha256 text NOT NULL
);
