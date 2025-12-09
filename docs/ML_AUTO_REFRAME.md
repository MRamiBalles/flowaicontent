# ML Auto-Reframe Technical Reference

Real-time subject detection for intelligent 9:16 video cropping using TensorFlow.js.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ VideoEditorPro  │────▶│  auto-reframe.ts │────▶│subject-detector │
│    (Button)     │     │  (Orchestrator)  │     │  (ML Engine)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                               ┌──────────────────┐
                                               │  TensorFlow.js   │
                                               │   COCO-SSD       │
                                               └──────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/subject-detector.ts` | TensorFlow.js COCO-SSD wrapper |
| `src/lib/auto-reframe.ts` | Keyframe generation + orchestration |
| `src/pages/VideoEditorPro.tsx` | UI button + state management |

---

## Detection Flow

### 1. Model Loading (Lazy)

```typescript
// subject-detector.ts
export async function loadDetectionModel(): Promise<void> {
    // Dynamic import to avoid bundle bloat (~2MB)
    const tf = await import('@tensorflow/tfjs');
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    
    // Use WebGL for GPU acceleration
    await tf.setBackend('webgl');
    
    // Load lightweight MobileNet variant
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
}
```

**Why lite_mobilenet_v2?**
- ~5MB vs ~20MB for full model
- 30fps inference on modern GPUs
- Detects 80 COCO classes (person, cat, dog, etc.)

### 2. Frame Sampling

```typescript
// subject-detector.ts
export async function analyzeVideoFrames(
    videoUrl: string,
    totalFrames: number,
    fps: number,
    keyframeInterval: number = 15  // Sample every 0.5s at 30fps
): Promise<Map<number, BoundingBox | null>>
```

**Sampling Strategy:**
- Default: 1 frame every 15 frames (0.5s at 30fps)
- For 60s video @ 30fps = 120 keyframes analyzed
- Progress callback for UI feedback

### 3. Object Detection

```typescript
// subject-detector.ts
export async function detectSubjectML(
    video: HTMLVideoElement,
    options: Partial<DetectionOptions>
): Promise<BoundingBox | null>
```

**Detection Options:**
```typescript
interface DetectionOptions {
    targetClasses: string[];      // ['person', 'cat', 'dog', 'bird']
    minConfidence: number;        // 0.5 (50% confidence threshold)
    prioritizeBy: 'largest' | 'centered' | 'confidence';
}
```

**Output:** Normalized bounding box (0-1 range):
```typescript
interface BoundingBox {
    x: number;      // Left edge (0-1)
    y: number;      // Top edge (0-1)
    width: number;  // Box width (0-1)
    height: number; // Box height (0-1)
    confidence: number;
    label: string;  // 'person', 'cat', etc.
}
```

### 4. Interpolation

```typescript
// subject-detector.ts
export function interpolateDetections(
    detections: Map<number, BoundingBox | null>,
    totalFrames: number
): Map<number, BoundingBox>
```

**Algorithm:**
1. Fill gaps between keyframes with linear interpolation
2. Carry forward last detection if subject exits frame
3. Smooth position to avoid jitter

### 5. Crop Calculation

```typescript
// auto-reframe.ts
function calculateCropRect(
    subjectBox: BoundingBox,
    sourceWidth: number,
    sourceHeight: number,
    targetAspectRatio: number  // 9/16 = 0.5625
): CropRect
```

**Logic:**
1. Calculate crop dimensions from aspect ratio
2. Center crop on subject bounding box
3. Clamp to source boundaries
4. Apply padding/margin for breathing room

### 6. Keyframe Generation

```typescript
// auto-reframe.ts
export async function autoReframeML(
    sourceWidth: number,
    sourceHeight: number,
    totalFrames: number,
    options: MLReframeOptions
): Promise<PositionKeyframe[]>
```

**Output:**
```typescript
interface PositionKeyframe {
    frame: number;
    x: number;  // Crop X position
    y: number;  // Crop Y position
}
```

---

## Performance Considerations

| Metric | Value |
|--------|-------|
| Model size | ~5MB (gzipped ~2MB) |
| Load time | 1-3s (first use only) |
| Inference | ~30ms/frame on GPU |
| 60s video analysis | ~4s total |

### Optimizations Applied

1. **Lazy Loading**: Model only downloads when user clicks button
2. **WebGL Backend**: GPU-accelerated inference
3. **Keyframe Sampling**: Not every frame, only every Nth
4. **Interpolation**: CPU-based, very fast

---

## Fallback Behavior

```typescript
// VideoEditorPro.tsx
if (!videoClip || !videoClip.source_url) {
    // No video → simulated detection (sine wave pattern)
    const keyframes = autoReframe(...);
    toast.success('Auto-Reframe: X keyframes (simulated)');
    return;
}

try {
    const keyframes = await autoReframeML(...);
} catch (error) {
    // ML failed → automatic fallback
    const keyframes = autoReframe(...);
    toast.warning('ML failed, using simulated detection');
}
```

---

## Supported Subject Classes

The COCO-SSD model detects these by default:

| Priority | Classes |
|----------|---------|
| High | `person` |
| Medium | `cat`, `dog`, `bird` |
| Low | All 80 COCO classes |

Custom classes can be configured via `targetClasses` option.

---

## Integration Points

### Adding to Preview

The generated keyframes integrate with the preview engine:

```typescript
// VideoEditorPro.tsx (preview render)
const props = getClipPropertiesAtFrame(clipKeyframes, localFrame);
// props.position_x, props.position_y apply the reframe crop
```

### Export via Remotion

```typescript
// remotion/src/Clip.tsx
const positionX = getAnimatedValue(keyframes, 'position_x', frame, 0);
const positionY = getAnimatedValue(keyframes, 'position_y', frame, 0);
// Applied to video transform
```
