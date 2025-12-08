# 🎮 Interactive AI Experiences - Documentation

> **Feature**: Interactive AI Experiences  
> **Version**: 1.0.0  
> **Last Updated**: 2025-12-08

---

## Overview

Choose-your-own-adventure branching video experiences with AI narration, choice tracking, and multiple endings.

---

## Database Schema (6 Tables)

| Table | Purpose |
|-------|---------|
| `interactive_stories` | Main story containers |
| `story_scenes` | Video segments |
| `scene_choices` | Decision points |
| `player_progress` | User saves |
| `choice_analytics` | Choice tracking |
| `story_templates` | Pre-made structures |

---

## Scene Types

| Type | Description |
|------|-------------|
| `intro` | First scene |
| `normal` | Regular scene |
| `ending` | Story conclusion |
| `death` | Game over |
| `checkpoint` | Save point |

---

## Ending Types

- `good` - Positive outcome (gold trophy)
- `bad` - Negative outcome (red)
- `neutral` - Neutral outcome
- `secret` - Hidden ending (purple)

---

## API Reference

**Endpoint**: `POST /functions/v1/interactive-stories`

| Action | Description |
|--------|-------------|
| `get_story` | Load full story tree |
| `start_story` | Begin from intro |
| `make_choice` | Select path |
| `get_progress` | Load saved games |
| `save_checkpoint` | Save current position |
| `get_analytics` | Creator analytics |

---

## Files Created

| File | Purpose |
|------|---------|
| [20251208170600_interactive_experiences.sql](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/migrations/20251208170600_interactive_experiences.sql) | Database |
| [interactive-stories/index.ts](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/functions/interactive-stories/index.ts) | API |
| [InteractivePlayer.tsx](file:///c:/Users/Manu/FlowAI/flowaicontent-10/src/pages/InteractivePlayer.tsx) | Player UI |

---

## Route: `/interactive`

---

## Deployment

```bash
npx supabase db push
npx supabase functions deploy interactive-stories
```
