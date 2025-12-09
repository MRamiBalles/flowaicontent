/**
 * lut-parser.ts
 * 
 * LUT (Look Up Table) parser and applier for color grading.
 * Supports .CUBE format (industry standard for color LUTs).
 * 
 * @module lib/lut-parser
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Parsed 3D LUT data structure */
export interface LUT3D {
    /** LUT title from file header */
    title: string;
    /** Size of LUT (e.g., 33 = 33x33x33 grid) */
    size: number;
    /** Minimum domain value (usually 0.0) */
    domainMin: [number, number, number];
    /** Maximum domain value (usually 1.0) */
    domainMax: [number, number, number];
    /** 3D color data as flat array [r, g, b, r, g, b, ...] */
    data: Float32Array;
}

/** Color value as RGB tuple (0-1 range) */
export type ColorRGB = [number, number, number];

// ============================================================
// PARSER
// ============================================================

/**
 * Parses a .CUBE file into a 3D LUT structure.
 * 
 * CUBE format specification:
 * - Lines starting with # are comments
 * - TITLE "name" defines the LUT name
 * - LUT_3D_SIZE n defines the grid size (n x n x n)
 * - DOMAIN_MIN r g b defines minimum input values
 * - DOMAIN_MAX r g b defines maximum input values
 * - Remaining lines are R G B values (space separated floats)
 * 
 * @param cubeContent - Raw text content of .CUBE file
 * @returns Parsed LUT3D structure
 * @throws Error if file format is invalid
 * 
 * @example
 * const response = await fetch('/path/to/lut.cube');
 * const cubeText = await response.text();
 * const lut = parseCubeFile(cubeText);
 */
export function parseCubeFile(cubeContent: string): LUT3D {
    const lines = cubeContent.split('\n').map(line => line.trim());

    let title = 'Untitled LUT';
    let size = 0;
    let domainMin: [number, number, number] = [0, 0, 0];
    let domainMax: [number, number, number] = [1, 1, 1];
    const colorValues: number[] = [];

    for (const line of lines) {
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;

        // Parse header directives
        if (line.startsWith('TITLE')) {
            // Extract title from quotes
            const match = line.match(/TITLE\s+"(.+)"/);
            if (match) title = match[1];
            continue;
        }

        if (line.startsWith('LUT_3D_SIZE')) {
            const match = line.match(/LUT_3D_SIZE\s+(\d+)/);
            if (match) size = parseInt(match[1], 10);
            continue;
        }

        if (line.startsWith('DOMAIN_MIN')) {
            const parts = line.split(/\s+/).slice(1).map(Number);
            if (parts.length === 3) {
                domainMin = parts as [number, number, number];
            }
            continue;
        }

        if (line.startsWith('DOMAIN_MAX')) {
            const parts = line.split(/\s+/).slice(1).map(Number);
            if (parts.length === 3) {
                domainMax = parts as [number, number, number];
            }
            continue;
        }

        // Parse color data (three floats per line)
        const parts = line.split(/\s+/).filter(p => p);
        if (parts.length === 3) {
            const [r, g, b] = parts.map(Number);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                colorValues.push(r, g, b);
            }
        }
    }

    // Validate parsed data
    if (size === 0) {
        throw new Error('LUT_3D_SIZE not found in CUBE file');
    }

    const expectedValues = size * size * size * 3;
    if (colorValues.length !== expectedValues) {
        throw new Error(
            `Invalid CUBE file: expected ${expectedValues} values, got ${colorValues.length}`
        );
    }

    return {
        title,
        size,
        domainMin,
        domainMax,
        data: new Float32Array(colorValues)
    };
}

// ============================================================
// COLOR TRANSFORMATION
// ============================================================

/**
 * Applies a 3D LUT to a color using trilinear interpolation.
 * 
 * @param lut - Parsed 3D LUT
 * @param color - Input color [r, g, b] in 0-1 range
 * @returns Transformed color [r, g, b]
 */
export function applyLUT(lut: LUT3D, color: ColorRGB): ColorRGB {
    const [r, g, b] = color;
    const size = lut.size;

    // Map input color to LUT domain
    const normR = clamp((r - lut.domainMin[0]) / (lut.domainMax[0] - lut.domainMin[0]), 0, 1);
    const normG = clamp((g - lut.domainMin[1]) / (lut.domainMax[1] - lut.domainMin[1]), 0, 1);
    const normB = clamp((b - lut.domainMin[2]) / (lut.domainMax[2] - lut.domainMin[2]), 0, 1);

    // Calculate grid position
    const maxIdx = size - 1;
    const rPos = normR * maxIdx;
    const gPos = normG * maxIdx;
    const bPos = normB * maxIdx;

    // Get lower and upper grid indices
    const rLow = Math.floor(rPos);
    const gLow = Math.floor(gPos);
    const bLow = Math.floor(bPos);

    const rHigh = Math.min(rLow + 1, maxIdx);
    const gHigh = Math.min(gLow + 1, maxIdx);
    const bHigh = Math.min(bLow + 1, maxIdx);

    // Interpolation weights
    const rFrac = rPos - rLow;
    const gFrac = gPos - gLow;
    const bFrac = bPos - bLow;

    // Trilinear interpolation (8 corner samples)
    const c000 = getLUTValue(lut, rLow, gLow, bLow);
    const c001 = getLUTValue(lut, rLow, gLow, bHigh);
    const c010 = getLUTValue(lut, rLow, gHigh, bLow);
    const c011 = getLUTValue(lut, rLow, gHigh, bHigh);
    const c100 = getLUTValue(lut, rHigh, gLow, bLow);
    const c101 = getLUTValue(lut, rHigh, gLow, bHigh);
    const c110 = getLUTValue(lut, rHigh, gHigh, bLow);
    const c111 = getLUTValue(lut, rHigh, gHigh, bHigh);

    // Interpolate along B axis
    const c00 = lerpColor(c000, c001, bFrac);
    const c01 = lerpColor(c010, c011, bFrac);
    const c10 = lerpColor(c100, c101, bFrac);
    const c11 = lerpColor(c110, c111, bFrac);

    // Interpolate along G axis
    const c0 = lerpColor(c00, c01, gFrac);
    const c1 = lerpColor(c10, c11, gFrac);

    // Interpolate along R axis
    return lerpColor(c0, c1, rFrac);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Gets a color value from the LUT data array.
 * 
 * @param lut - Parsed 3D LUT
 * @param r - Red index (0 to size-1)
 * @param g - Green index (0 to size-1)
 * @param b - Blue index (0 to size-1)
 * @returns Color at that position
 */
function getLUTValue(lut: LUT3D, r: number, g: number, b: number): ColorRGB {
    // CUBE format orders: R varies fastest, then G, then B
    const idx = (b * lut.size * lut.size + g * lut.size + r) * 3;
    return [
        lut.data[idx],
        lut.data[idx + 1],
        lut.data[idx + 2]
    ];
}

/**
 * Linearly interpolates between two colors.
 * 
 * @param a - Start color
 * @param b - End color
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated color
 */
function lerpColor(a: ColorRGB, b: ColorRGB, t: number): ColorRGB {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];
}

/**
 * Clamps a value to a range.
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ============================================================
// WEBGL SHADER GENERATION
// ============================================================

/**
 * Generates GLSL shader code for applying a 3D LUT.
 * The LUT data should be uploaded as a 3D texture.
 * 
 * @returns Fragment shader code
 */
export function generateLUTShader(): string {
    return `
        precision mediump float;
        
        uniform sampler2D uInputTexture;
        uniform sampler3D uLUTTexture;
        uniform float uIntensity;
        
        varying vec2 vTexCoord;
        
        void main() {
            vec4 inputColor = texture2D(uInputTexture, vTexCoord);
            
            // Sample the 3D LUT
            vec3 lutCoord = inputColor.rgb;
            vec3 lutColor = texture3D(uLUTTexture, lutCoord).rgb;
            
            // Blend based on intensity
            vec3 finalColor = mix(inputColor.rgb, lutColor, uIntensity);
            
            gl_FragColor = vec4(finalColor, inputColor.a);
        }
    `;
}

/**
 * Creates a 3D texture from LUT data for WebGL.
 * 
 * @param gl - WebGL2 context (required for 3D textures)
 * @param lut - Parsed 3D LUT
 * @returns WebGL texture object
 */
export function createLUTTexture(
    gl: WebGL2RenderingContext,
    lut: LUT3D
): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_3D, texture);

    gl.texImage3D(
        gl.TEXTURE_3D,
        0,                          // level
        gl.RGB32F,                  // internal format
        lut.size,                   // width
        lut.size,                   // height
        lut.size,                   // depth
        0,                          // border
        gl.RGB,                     // format
        gl.FLOAT,                   // type
        lut.data                    // data
    );

    // Linear interpolation for smooth color transitions
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    return texture;
}
