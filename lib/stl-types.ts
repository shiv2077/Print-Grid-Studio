// Shared types for the STL parser worker, the React hook, and tests.
// Keep this file pure types — no logic, no DOM/Worker references.

export type Vec3 = readonly [number, number, number];

export interface StlParseResult {
  triangleCount: number;
  volumeMm3: number;
  bboxMin: Vec3;
  bboxMax: Vec3;
  bboxSize: Vec3;
  isAscii: boolean;
  parseTimeMs: number;
  /** True when triangleCount > 250_000 — viewer should switch to flat
   *  material and disable shadows. */
  highPolyWarning: boolean;
}

export type StlErrorCode =
  | 'TOO_LARGE'
  | 'EMPTY'
  | 'PARSE_ERROR'
  | 'WORKER_ERROR';

export interface StlError {
  code: StlErrorCode;
  message: string;
}

export interface StlWorkerSuccess {
  ok: true;
  result: StlParseResult;
}

export interface StlWorkerFailure {
  ok: false;
  error: StlError;
}

export type StlWorkerMessage = StlWorkerSuccess | StlWorkerFailure;

/** Hard-cap on STL upload size in bytes. Matches Claude.md Prompt 3. */
export const STL_MAX_BYTES = 100 * 1024 * 1024;

/** Trigger the high-poly viewer flag above this triangle count. */
export const HIGH_POLY_THRESHOLD = 250_000;
