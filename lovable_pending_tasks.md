# Lovable – Pending Tasks (Frontend & Integration)

## ✅ Completed (already in place)
- Auth pages (`/auth` login & signup) with Supabase
- Admin dashboard (`/admin`) with role‑based UI
- `user_roles` table, RLS policies, default `user` role
- JWT verification in backend (`supabase_service.py`)
- API client (`flowai-api.ts`) with automatic token injection

## ⏳ Pending Tasks

### 1. Frontend Configuration
- **Update `VITE_API_URL`** to the Railway backend URL (e.g. `https://flowai-backend-xxxx.railway.app/v1`).
- **CORS verification** – ensure the backend `ALLOWED_ORIGINS` includes the Lovable/Vercel domain.
- **Deploy updated frontend** (Vercel redeploy will happen automatically after env var change).

### 2. End‑to‑End Testing
- Sign‑up a new user → verify `user_profiles` and `user_roles` rows are created.
- Login → confirm JWT is sent on every API call.
- Access protected routes (dashboard, admin) with appropriate roles.
- Upgrade tier, purchase tokens, use referral system, create bounty, etc.
- Run the full test suite (`npm test` / `pytest`).

### 3. Production Checklist
- **Health‑check** (`/health`) passes on Railway.
- **API docs** (`/docs`) accessible.
- **Rate limiting** enabled (Redis).
- **SSL** enforced on both frontend and backend.
- **Monitoring** (Sentry) configured for frontend and backend errors.
- **Backup** of Supabase database (daily dump).

### 4. Auditing & Notifications (Lovable enhancements)
- **Audit log** for admin actions (role changes, user deletions).
- **Email notifications** when a user is promoted to `moderator` or `admin` (edge function).
- **Role‑based dashboard widgets**:
  - Admin → full user list & management.
  - Moderator → flagged content view.
  - User → personal stats & usage.

### 5. Documentation Updates
- Add the above steps to `docs/DEPLOYMENT.md` and `docs/README.md`.
- Create a short **Lovable integration guide** (markdown) for future developers.

### 6. Final Verification & Release
- Perform a **smoke test** on the live URLs (frontend + backend).
- Record a **quick demo video** showing the full auth flow and admin dashboard (already in `video_demo_script.md`).
- Share the live demo link with investors.

---

**Next Action:**
1. Obtain the Railway backend URL and update `VITE_API_URL`.
2. Redeploy the frontend.
3. Run the end‑to‑end test checklist.
4. Tick off the items above as they are completed.

*Keep this file as the single source of truth for what remains on the Lovable side.*
