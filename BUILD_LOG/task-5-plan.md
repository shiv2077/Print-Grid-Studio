# Task 5 — STL parser worker — plan

## Goal
A classic Web Worker that parses STL ArrayBuffers off the main thread,
plus a React hook (`useStlParser`) that wraps the worker via
postMessage, plus tests against a programmatically generated cube STL.

## Source-of-truth issue

Task 5 says: "Drop `/public/stl-parser.worker.js` from kit v2 Section 6
verbatim". **Kit v2 is not on disk.** Kit v3 (the one we have) only
references it. The closest spec is in `Claude.md` Prompt 3:
- ASCII vs binary autodetect
- Binary: 80-byte header → uint32 triCount → 50 bytes per triangle
- Volume via signed-tetrahedron summation: `Σ (v0 · (v1 × v2)) / 6`
- File-size cap 100MB → reject with clear error
- Triangle count > 500k → flag `highPolyWarning`

So I am writing the worker myself from the Claude.md spec. Logged in
needs-human.md.

## Architecture

- `public/stl-parser.worker.js` — classic Web Worker (vanilla JS so
  Next.js serves it from `/public` without bundler config).
- `lib/stl-parse.ts` — **pure TypeScript port of the same algorithm**.
  Exported. Tested directly in Node/jsdom. The worker.js duplicates
  this logic; drift risk noted in needs-human.md.
- `lib/stl-types.ts` — `StlParseResult`, `StlError` types shared by
  worker, hook, and tests.
- `lib/use-stl-parser.ts` — React hook (`'use client'`):
  - `parse(file: File): Promise<StlParseResult>`
  - returns `{ parse, result, error, isLoading }`
  - lazy-instantiates worker on first parse
  - handles concurrent calls (queues — only one parse in flight per
    hook instance)
  - terminates worker on unmount
- `tests/stl-parse.test.ts` — feeds the pure TS function generated cube
  bytes (binary STL of a 10mm cube) and asserts:
  - triangleCount = 12 (cube = 12 tris)
  - volumeMm3 = 1000 (10³, ±1% tolerance)
  - bbox min/max correct
  - isAscii = false
  - parses an ASCII cube STL too
  - rejects malformed binary
  - rejects oversize (>100MB) — with a stub buffer

## Algorithm details (Claude.md-derived)

### Format detection
- Binary: 80-byte header + uint32 triCount + 50 bytes/triangle
  (12 normal + 12+12+12 vertices + 2 attr).
- ASCII: starts with "solid " (case-insensitive) AND has "facet normal"
  within the first 200 bytes.
- Quirk: some binary STLs ALSO start with "solid" in the header. The
  Claude.md spec says: "scan first 200 bytes for `facet normal`" — if
  not found, treat as binary regardless of leading "solid".

### Binary parse
```js
const view = new DataView(buffer);
const triCount = view.getUint32(80, true);  // little-endian
// expected size: 84 + triCount*50
if (buffer.byteLength !== 84 + triCount * 50) throw new Error('size mismatch');
let offset = 84;
for (let i = 0; i < triCount; i++) {
  // skip normal (12 bytes)
  // read 3 vertices, 4 bytes each (float32 LE)
  // accumulate volume += dot(v0, cross(v1, v2)) / 6
  // update bbox
  offset += 50;
}
```

### ASCII parse
Stream the text, regex out facet blocks. Slow but rare for >5MB STLs.

### Volume
For each triangle (v0, v1, v2): `signedVolume = (v0 · (v1 × v2)) / 6`.
Sum signed values, then `Math.abs(sum)` at the end. This handles
non-watertight meshes about as well as anything reasonable.

### Bbox
`min = elementwise min` across all vertices; `max = elementwise max`;
`size = max - min`.

## Worker message contract

Worker receives:
```js
{ buffer: ArrayBuffer }
```
(transferable; the worker takes ownership)

Worker posts back:
```js
// success
{ ok: true, result: StlParseResult }
// failure
{ ok: false, error: { code: 'TOO_LARGE' | 'PARSE_ERROR' | 'EMPTY', message: string } }
```

## Hook contract (`useStlParser`)

```ts
type ParserState = {
  result: StlParseResult | null;
  error: StlError | null;
  isLoading: boolean;
  parse: (file: File) => Promise<StlParseResult>;
  reset: () => void;
};
```

- `parse` reads the file as ArrayBuffer (await `file.arrayBuffer()`),
  posts to worker, waits for one message, resolves.
- If a parse is in flight, a new `parse()` queues until the previous
  completes (preserves React state ordering).
- Worker created lazily on first call; terminated in unmount cleanup.
- `reset()` clears `result` and `error`.

## Test plan

Generate cube STL bytes programmatically (helper in test file). Cube
geometry: 8 vertices, 12 triangles. Output bytes must match the
binary STL spec exactly so I can test the parser against known-correct
data.

```
cube.stl =
  80 bytes header (zeros)
  + uint32 triCount = 12
  + 12 × (12 normal + 12 v0 + 12 v1 + 12 v2 + 2 attr)
  = 80 + 4 + 12*50 = 684 bytes
```

A cube of side 10mm centered at origin: vertices ±5 in each axis.
Volume = 1000 mm³.

Tests (Vitest):
1. binary cube → triCount=12, volume in [990, 1010], bbox correct, isAscii=false
2. ASCII cube → same expected, isAscii=true
3. malformed binary (size mismatch) → throws PARSE_ERROR
4. oversize (101MB stub Uint8Array) → throws TOO_LARGE
5. empty buffer → throws EMPTY
6. high-poly flag — parse a 600k-tri stub buffer → highPolyWarning=true

For the hook itself, I'll skip a full Worker-mocking test tonight
(jsdom Worker support is fiddly). The pure TS function is what carries
the logic; the hook is plumbing.

## Out of scope for Task 5

- Real STL viewer (R3F) — that's Task 10's `<StlViewer />`
- Mass calculation as an STL output — `lib/pricing.ts` already exposes
  `computeMass(volumeMm3, materialKey)` and that's what Task 10 will call
- An ASCII cube STL fixture file in /public — generated programmatically
  in tests instead of committed as a binary asset
