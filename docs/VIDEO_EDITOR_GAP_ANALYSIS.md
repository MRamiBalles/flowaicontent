# Video Editor: Feature Gap Analysis

Comparison of FlowAI Video Editor against industry-standard tools.

## Feature Matrix

| Category | Feature | FlowAI | Premiere | CapCut | YouTube Studio |
|----------|---------|--------|----------|--------|----------------|
| **Timeline** | Multi-track | ✅ | ✅ | ✅ | ✅ |
| | Drag & drop | ✅ | ✅ | ✅ | ✅ |
| | Clip splitting | ✅ | ✅ | ✅ | ✅ |
| | Ripple edit | ❌ | ✅ | ✅ | ❌ |
| | Magnetic snap | ❌ | ✅ | ✅ | ❌ |
| | Keyframes | ❌ | ✅ | ✅ | ❌ |
| | Undo/Redo | ❌ | ✅ | ✅ | ✅ |
| **Visual** | Color correction | ❌ | ✅ | ✅ | ❌ |
| | LUT support | ❌ | ✅ | ✅ | ❌ |
| | Masking | ❌ | ✅ | ✅ | ❌ |
| | Green screen | ❌ | ✅ | ✅ | ❌ |
| | Filters/presets | ❌ | ✅ | ✅ | ❌ |
| **Audio** | Volume mixer | ❌ | ✅ | ✅ | ✅ |
| | Auto-ducking | ❌ | ✅ | ✅ | ❌ |
| | Noise reduction | ❌ | ✅ | ✅ | ❌ |
| | Beat sync | ❌ | ❌ | ✅ | ❌ |
| **AI** | Auto-subtitles | ✅ | ❌ | ✅ | ✅ |
| | Silence removal | ❌ | ❌ | ❌ | ❌ |
| | Auto-reframe | ❌ | ✅ | ✅ | ❌ |
| | Subject tracking | ❌ | ✅ | ✅ | ❌ |
| **Export** | Cloud render | ✅ | ❌ | ❌ | ✅ |
| | 4K output | ✅ | ✅ | ✅ | ✅ |

## Priority Implementation Queue

### Tier 1 (High Impact)

**Keyframe Animation**
- Animate position, scale, opacity over time
- Diamond markers on timeline
- Linear and eased interpolation

**Silence Removal**
- Analyze audio waveform
- Detect segments below -40dB threshold
- Auto-generate cut points

**Magnetic Timeline**
- Snap clips to adjacent edges
- Fill gaps on delete
- Nudge clips with arrow keys

### Tier 2 (Workflow Enhancement)

**Color Correction**
- Exposure, contrast, saturation sliders
- Temperature and tint adjustment
- Per-clip color settings

**Audio Auto-Ducking**
- Detect voice track
- Lower music track during speech
- Configurable threshold

**Undo/Redo Stack**
- Action history (50 steps)
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Visual history panel

### Tier 3 (Advanced)

**Auto-Reframe**
- AI subject detection
- Smart crop for vertical formats
- Smooth pan-and-scan

**LUT Import**
- Parse .CUBE files
- Apply via WebGL shader
- Real-time preview

## Technical Notes

### Keyframe Implementation

Schema already exists (`video_keyframes` table). Frontend requires:

1. Keyframe marker component for clips
2. Property graph editor panel
3. Interpolation engine:
   ```typescript
   function interpolate(keyframes: Keyframe[], frame: number): number {
     const prev = keyframes.filter(k => k.frame <= frame).pop();
     const next = keyframes.find(k => k.frame > frame);
     if (!prev || !next) return prev?.value ?? next?.value ?? 0;
     const t = (frame - prev.frame) / (next.frame - prev.frame);
     return lerp(prev.value, next.value, t);
   }
   ```

### Silence Detection

Use Web Audio API for client-side analysis:

1. Decode audio to `AudioBuffer`
2. Read amplitude data from `getChannelData()`
3. Identify runs where RMS < threshold
4. Return frame ranges for cuts

### Magnetic Timeline

Modify drag-and-drop handler:

1. On drop, find nearest clip edge within snap distance (10px)
2. Adjust `start_frame` to align
3. On delete, shift subsequent clips by deleted duration
