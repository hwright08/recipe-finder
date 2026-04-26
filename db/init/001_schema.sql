CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_display_name_not_blank CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_sessions_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kitchens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'Home kitchen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kitchens_user_name_unique UNIQUE (user_id, name),
  CONSTRAINT kitchens_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT food_items_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT food_items_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS kitchen_food_items (
  id SERIAL PRIMARY KEY,
  kitchen_id INTEGER NOT NULL,
  food_item_id INTEGER NOT NULL,
  is_low BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kitchen_food_items_kitchen_id_fk
    FOREIGN KEY (kitchen_id)
    REFERENCES kitchens (id)
    ON DELETE CASCADE,
  CONSTRAINT kitchen_food_items_food_item_id_fk
    FOREIGN KEY (food_item_id)
    REFERENCES food_items (id)
    ON DELETE RESTRICT,
  CONSTRAINT kitchen_food_items_kitchen_food_unique UNIQUE (kitchen_id, food_item_id)
);

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT recipes_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT recipes_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE IF NOT EXISTS recipe_food_items (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL,
  food_item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT recipe_food_items_recipe_id_fk
    FOREIGN KEY (recipe_id)
    REFERENCES recipes (id)
    ON DELETE CASCADE,
  CONSTRAINT recipe_food_items_food_item_id_fk
    FOREIGN KEY (food_item_id)
    REFERENCES food_items (id)
    ON DELETE RESTRICT,
  CONSTRAINT recipe_food_items_recipe_food_unique UNIQUE (recipe_id, food_item_id)
);
