import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      avatar_color VARCHAR(20) DEFAULT '#F5C518',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(20) DEFAULT '#F5C518',
      owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'active',
      due_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(50) DEFAULT 'medium',
      due_date TIMESTAMPTZ,
      reminder_at TIMESTAMPTZ,
      position INTEGER DEFAULT 0,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      type VARCHAR(50) DEFAULT 'info',
      read BOOLEAN DEFAULT FALSE,
      task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    )
  `;

  // Waitlist: people who want access
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      message TEXT,
      approved BOOLEAN DEFAULT FALSE,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // AI usage rate-limiting (per user per day)
  await sql`
    CREATE TABLE IF NOT EXISTS ai_usage (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      call_count INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, usage_date)
    )
  `;

  // Extend users table with access control + preferences
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dev_code_used TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN DEFAULT FALSE`;

  // Grant access to all existing users (they pre-date the access gate)
  await sql`UPDATE users SET access_granted = TRUE WHERE access_granted IS FALSE OR access_granted IS NULL`;
}

export default sql;
