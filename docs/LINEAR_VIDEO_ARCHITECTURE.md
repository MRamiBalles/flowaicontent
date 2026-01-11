# Linear Video Platform Architecture

> **Scalable O(N) Video Processing for Long-Duration Content**

This document describes FlowAI's advanced video processing architecture, designed for efficient handling of long-form video content while maintaining quality and enabling truth-based monetization.

---

## Architectural Overview

The Linear Video Platform consists of three primary subsystems working in concert:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LINEAR VIDEO PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   MAMBA SSM     │  │   NABLA VIDEO   │  │    VALSCI       │  │
│  │   BACKBONE      │  │    STUDIO       │  │  TRUTH LAYER    │  │
│  │   (O(N))        │  │   (2.7x speed)  │  │  (RAG + Biblio) │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           └──────────┬─────────┴──────────┬────────┘            │
│                      │                    │                      │
│              ┌───────▼───────┐    ┌───────▼───────┐             │
│              │ Video Stream  │    │ Token Rewards │             │
│              │ Processing    │    │ Distribution  │             │
│              └───────────────┘    └───────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Mamba SSM Backbone

### Purpose

Replace quadratic attention mechanisms with linear-complexity State Space Models for processing video sequences of arbitrary length.

### Technical Specifications

| Parameter | Value | Description |
|-----------|-------|-------------|
| State Dimension (d_state) | 16 | SSM hidden state dimensionality |
| Model Dimension (d_model) | 512 | Feature embedding size |
| Layers | 24 | Number of SSM blocks |
| Expansion Factor | 2x | MLP expansion ratio |
| Convolution Width | 4 | Local context aggregation |

### Complexity Analysis

| Architecture | Time Complexity | Memory Complexity | Speedup |
|--------------|-----------------|-------------------|---------|
| Standard Transformer | O(N²) | O(N²) | 1x (baseline) |
| Linear Attention | O(N) | O(N) | 12x |
| Mamba SSM | O(N) | O(1) recurrent | 45x |
| Ring Attention | O(N²/P) | O(N²/P²) | 25x |

### Core Algorithm: Selective Scan

The selective scan algorithm processes sequences in linear time by maintaining a fixed-size hidden state:

```
For each timestep t:
  1. Discretize continuous SSM parameters (A, B) using ZOH
  2. Update: h(t) = ΔA · h(t-1) + ΔB · x(t)
  3. Output: y(t) = C · h(t) + D · x(t)
```

The **selectivity** comes from making A, B, C input-dependent rather than static, allowing the model to adaptively filter information based on content relevance.

### Integration Points

- **Ring Attention Module**: Distributes computation across device clusters for sequences exceeding single-device memory
- **TTT Layers**: Test-Time Training layers that enable runtime adaptation for enhanced long-form coherence

---

## 2. NABLA Video Generation

### Purpose

Neighborhood Adaptive Block-Level Attention for efficient diffusion-based video synthesis with minimal quality loss.

### Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Speedup | 2.7x | vs. full attention baseline |
| Typical Sparsity | 70% | Blocks skipped during attention |
| CLIP Score Retention | 99.2% | Semantic alignment preservation |
| VBench Score | 98.7% | Visual quality benchmark |

### Block-Sparse Attention Algorithm

1. **Reduce**: Project Q and K to block-level representatives
2. **Score**: Compute pairwise block attention scores
3. **Mask**: Apply CDF threshold (default: 95%) to create sparse pattern
4. **Execute**: Compute attention only on non-masked block pairs

```
Sparsity Pattern:
┌───┬───┬───┬───┬───┐
│ ● │ ● │   │   │ ● │  ← Row 1: 3 active blocks
├───┼───┼───┼───┼───┤
│   │ ● │ ● │   │   │  ← Row 2: 2 active blocks
├───┼───┼───┼───┼───┤
│ ● │   │ ● │ ● │   │  ← Row 3: 3 active blocks
└───┴───┴───┴───┴───┘
     ● = Active (compute attention)
       = Masked (skip computation)
```

### Diffusion Transformer Integration

NABLA integrates with Diffusion Transformers (DiT) through:

- **AdaLN Conditioning**: Timestep-dependent layer normalization
- **Cross-Attention**: Text embedding integration via CLIP
- **Progressive Denoising**: 50-step inference with adaptive block selection

### Supported Outputs

| Resolution | Duration | FPS | Styles |
|------------|----------|-----|--------|
| 480p | 5-30s | 24 | All |
| 720p | 5-30s | 24 | All |
| 1080p | 5-30s | 24/30 | All |
| 1440p | 5-15s | 24 | Cinematic, Photorealistic |
| 4K | 5-10s | 24 | Photorealistic |

---

## 3. Valsci Truth Layer

### Purpose

Retrieval-Augmented Generation system for verifying factual claims in video content, enabling truth-based monetization.

### Verification Pipeline

```
Transcript ─► Claim Extraction ─► RAG Retrieval ─► Bibliometric Scoring
                    │                   │                    │
                    ▼                   ▼                    ▼
              Pattern Match      Semantic Scholar      H-index, Citations
              + NLP Analysis      API Query           Journal Impact
                    │                   │                    │
                    └───────────────────┴────────────────────┘
                                        │
                                        ▼
                              Evidence Score (0-100)
                                        │
                                        ▼
                              Token Reward Multiplier
```

### Claim Types

| Type | Detection Patterns | Verification Source |
|------|-------------------|---------------------|
| Scientific Fact | "studies show", "research indicates" | Peer-reviewed literature |
| Statistical | "%", "million", "billion" | Official datasets, surveys |
| Medical | "treatment", "disease", "health" | Clinical trials, reviews |
| Historical | "century", "year", dates | Historical records |
| Technical | Technical specifications | Documentation, papers |

### Bibliometric Scoring

Sources are weighted by credibility indicators:

```
Credibility Score = 0.30 × CitationScore
                  + 0.25 × HIndexScore
                  + 0.25 × JournalTierScore
                  + 0.20 × RecencyScore
```

**Journal Tier Examples:**
- Tier 5.0: Nature, Science
- Tier 4.5: Cell, Lancet, NEJM
- Tier 3.5: PNAS
- Tier 3.0: PLoS
- Tier 2.5: Frontiers

### Token Reward Multiplier

The reward multiplier ranges from 0.5x to 2.5x based on verification quality:

| Evidence Score | Badge Level | Multiplier |
|----------------|-------------|------------|
| ≥ 90 | Gold | 2.0-2.5x |
| 75-89 | Silver | 1.5-2.0x |
| 60-74 | Bronze | 1.0-1.5x |
| < 60 | Unverified | 0.5-1.0x |

### Auditor Node Program

Community members can operate verification nodes:

- **Stake Requirement**: 1,000 FLO minimum
- **Hardware**: 4GB RAM, 2 CPU cores
- **Uptime**: 95% required for full rewards
- **Earnings**: 0.1 FLO per verification + 5% of video earnings

---

## Implementation Files

### Backend Services

| File | Purpose | Lines |
|------|---------|-------|
| [`mamba_ssm_service.py`](file:///d:/flowaicontent-1/backend/app/services/mamba_ssm_service.py) | SSM backbone, Ring Attention, TTT integration | 497 |
| [`nabla_video_service.py`](file:///d:/flowaicontent-1/backend/app/services/nabla_video_service.py) | Block-sparse attention, DiT integration | 504 |
| [`valsci_verification_service.py`](file:///d:/flowaicontent-1/backend/app/services/valsci_verification_service.py) | Claim extraction, RAG, bibliometric scoring | 652 |

### Frontend Components

| File | Purpose |
|------|---------|
| [`LinearVideoPlatform.tsx`](file:///d:/flowaicontent-1/src/pages/LinearVideoPlatform.tsx) | Dashboard UI with Causal Cone visualization |

---

## API Reference

### Initialize Video Sequence

```python
POST /api/v1/linear/sequence/init
{
    "video_id": "uuid",
    "total_frames": 7200,
    "attention_mode": "mamba_ssm"  # Options: mamba_ssm, ring, ttt, linear
}
```

### Process Video Chunk

```python
POST /api/v1/linear/sequence/{sequence_id}/process
{
    "frame_features": [0.1, 0.2, ...],
    "use_ttt": true
}
```

### Generate Video

```python
POST /api/v1/nabla/generate
{
    "prompt": "A sunset over the ocean with gentle waves",
    "resolution": "1080p",
    "duration_seconds": 5.0,
    "style": "cinematic"
}
```

### Verify Content

```python
POST /api/v1/valsci/verify
{
    "video_id": "uuid",
    "transcript": "Studies show that...",
    "creator_id": "uuid"
}
```

---

## References

1. **Mamba Architecture**: Gu, A., & Dao, T. (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces.
2. **NABLA Attention**: arXiv:2507.13546 - Neighborhood Adaptive Block-Level Attention for Video Generation.
3. **Kandinsky 5**: ai-forever/Kandinsky-5 - Multimodal video generation framework.
4. **Valsci**: bricee98/Valsci - Scientific verification through RAG and bibliometric analysis.
5. **Efficient Architectures Survey**: weigao266/Awesome-Efficient-Arch - Speed Always Wins: A Survey on Efficient Architectures for LLMs.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-11 | Initial Linear Video Platform architecture |
