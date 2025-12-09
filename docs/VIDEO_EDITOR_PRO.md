# Video Editor Pro

Technical reference for the browser-based video editing suite.

| Property | Value |
|----------|-------|
| Component | `src/pages/VideoEditorPro.tsx` |
| Backend | Supabase Edge Functions + AWS Lambda |
| Status | Production |

## System Design

The editor follows a three-tier architecture:

1. **Client** - React component with timeline UI, preview canvas, and property panels
2. **Database** - PostgreSQL stores projects, tracks, clips, and keyframes
3. **Render Pipeline** - Edge Function triggers AWS Lambda for video encoding

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐
│  React Editor   │────▶│  Supabase   │────▶│ AWS Lambda  │
│  (Browser)      │     │  (Postgres) │     │ (Remotion)  │
└─────────────────┘     └─────────────┘     └─────────────┘
         │                     │                    │
         ▼                     ▼                    ▼
   Real-time Edit         Persist Data        Render MP4
```

## Database Tables

### `video_projects`

Stores project metadata and render state.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner reference |
| `name` | TEXT | Display title |
| `width`, `height` | INT | Canvas dimensions (default 1920×1080) |
| `fps` | INT | Frame rate (default 30) |
| `duration_frames` | INT | Project length in frames |
| `composition_data` | JSONB | Serialized timeline state |
| `render_status` | TEXT | `draft` / `queued` / `rendering` / `completed` / `failed` |
| `rendered_video_url` | TEXT | S3 download link after render |

### `video_tracks`

Vertical lanes in the timeline. Each track holds one media type.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Parent project |
| `track_type` | TEXT | `video` / `audio` / `text` / `image` |
| `order_index` | INT | Vertical stacking order (0 = top) |
| `is_locked` | BOOL | Prevents editing |
| `is_muted` | BOOL | Silences audio playback |

### `video_clips`

Individual media segments placed on tracks.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `track_id` | UUID | Parent track |
| `clip_type` | TEXT | `video` / `audio` / `text` / `ai_generated` |
| `start_frame`, `end_frame` | INT | Timeline position |
| `source_url` | TEXT | Media file location |
| `position_x`, `position_y` | NUMERIC | Canvas offset |
| `scale_x`, `scale_y` | NUMERIC | Transform scale |
| `rotation` | NUMERIC | Degrees |
| `text_content` | TEXT | Caption text (for text clips) |

### `video_keyframes`

Animation data for property interpolation.

| Column | Type | Notes |
|--------|------|-------|
| `clip_id` | UUID | Parent clip |
| `frame` | INT | Keyframe position |
| `property` | TEXT | `opacity` / `scale` / `position_x` / etc. |
| `value` | NUMERIC | Value at this frame |
| `easing` | TEXT | `linear` / `ease-in` / `ease-out` |

### `video_transitions`

Effects applied between adjacent clips.

| Column | Type | Notes |
|--------|------|-------|
| `from_clip_id` | UUID | Outgoing clip |
| `to_clip_id` | UUID | Incoming clip |
| `transition_type` | TEXT | `fade` / `dissolve` / `wipe` / `slide` |
| `duration_frames` | INT | Transition length (default 15) |

## API Reference

### Render Video

Initiates server-side rendering of a project.

```
POST /functions/v1/render-video
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "uuid",
  "quality": "high",
  "format": "mp4"
}
```

**Response (202 Accepted)**:
```json
{
  "render_id": "uuid",
  "status": "queued"
}
```

### Quality Tiers

| Tier | Resolution | Plan Required |
|------|------------|---------------|
| `draft` | 720p | Free |
| `medium` | 1080p | Pro |
| `high` | 1080p 60fps | Pro |
| `ultra` | 4K | Business |

## Editor Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: Project Name │ Save │ Export                    │
├──────────┬─────────────────────────────────┬────────────┤
│          │                                 │            │
│  Assets  │        Preview Canvas           │ Properties │
│  Panel   │                                 │   Panel    │
│          ├─────────────────────────────────┤            │
│          │       Playback Controls         │            │
├──────────┴─────────────────────────────────┴────────────┤
│                     Timeline                            │
│  [Video] ████████░░░░░████████░░░░░░░░░░░░             │
│  [Audio] ░░░░░░░░████████████░░░░░░░░░░░░░             │
│  [Text]  ░░░░████░░░░░░░░░░░░░░░░░███░░░░░             │
└─────────────────────────────────────────────────────────┘
```

## Current Features

- Multi-track timeline with drag-and-drop
- Clip splitting at playhead (scissors tool)
- Transitions between adjacent clips
- Auto-generated subtitles (AI)
- Cloud rendering via AWS Lambda
- **AI Silence Removal** (removes silent segments from audio/video clips)
- **Magnetic Timeline** (clips snap to adjacent edges, ripple delete)
- **Keyframe Animation** (animate opacity, position, scale, rotation with easing)
- **Audio Auto-Ducking** (automatically lowers music when voice is detected)
- **LUT Support** (load .CUBE files for professional color grading)
- **Auto-Reframe 9:16** (convert horizontal video to vertical with smooth pan)
- **Viral Moment Finder** (identify high-energy segments for clips)

## Planned Features

See [Gap Analysis](VIDEO_EDITOR_GAP_ANALYSIS.md) for comparison with Premiere/CapCut.

**High Priority**:
- Keyframe animation engine
- AI silence removal
- Magnetic timeline (auto-snap)

**Medium Priority**:
- Color correction (HSL curves)
- LUT import (.CUBE)
- Audio auto-ducking

## Deployment

1. Apply database migrations:
   ```bash
   npx supabase db push
   ```

2. Deploy Edge Function:
   ```bash
   npx supabase functions deploy render-video
   ```

3. Configure AWS credentials in Supabase dashboard:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `REMOTION_SERVE_URL`

## Files

| Path | Purpose |
|------|---------|
| `src/pages/VideoEditorPro.tsx` | Main editor component |
| `supabase/functions/render-video/index.ts` | Render trigger |
| `supabase/migrations/*video*.sql` | Database schema |
