import sql from '../db.js';

// Per-user daily AI call limit
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || '20');

export async function aiRateLimit(req, res, next) {
  const userId = req.user?.id;
  if (!userId) return next(); // auth middleware already blocks unauthenticated

  try {
    // Upsert today's usage row
    const [row] = await sql`
      INSERT INTO ai_usage (user_id, usage_date, call_count)
      VALUES (${userId}, CURRENT_DATE, 1)
      ON CONFLICT (user_id, usage_date) DO UPDATE
        SET call_count = ai_usage.call_count + 1
      RETURNING call_count
    `;

    const used = row.call_count;
    res.setHeader('X-AI-Calls-Today', used);
    res.setHeader('X-AI-Calls-Limit', DAILY_LIMIT);

    if (used > DAILY_LIMIT) {
      return res.status(429).json({
        error: `Daily AI limit reached (${DAILY_LIMIT} calls/day). Resets at midnight.`,
        limit: DAILY_LIMIT,
        used,
        reset: 'midnight UTC',
      });
    }

    next();
  } catch (err) {
    // Don't block the request if rate limit check fails
    next();
  }
}

export async function getAIUsage(userId) {
  try {
    const [row] = await sql`
      SELECT call_count FROM ai_usage
      WHERE user_id = ${userId} AND usage_date = CURRENT_DATE
    `;
    return { used: row?.call_count || 0, limit: DAILY_LIMIT };
  } catch {
    return { used: 0, limit: DAILY_LIMIT };
  }
}
