'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  StlError,
  StlParseResult,
  StlWorkerMessage,
} from './stl-types';

const WORKER_URL = '/stl-parser.worker.js';

export interface UseStlParserState {
  result: StlParseResult | null;
  error: StlError | null;
  isLoading: boolean;
  parse: (file: File) => Promise<StlParseResult>;
  reset: () => void;
}

/**
 * React hook wrapping the classic Web Worker at /stl-parser.worker.js.
 * One worker per hook instance, lazily created on first parse() call,
 * terminated on unmount. Concurrent parse() calls are serialised — the
 * caller awaits in order.
 */
export function useStlParser(): UseStlParserState {
  const workerRef = useRef<Worker | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [result, setResult] = useState<StlParseResult | null>(null);
  const [error, setError] = useState<StlError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const ensureWorker = useCallback((): Worker => {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers are not available in this environment');
    }
    if (!workerRef.current) {
      workerRef.current = new Worker(WORKER_URL);
    }
    return workerRef.current;
  }, []);

  const parse = useCallback(
    (file: File): Promise<StlParseResult> => {
      const next = queueRef.current.then(() => parseOnce(file));
      // Keep queueRef chained but swallow errors so a failed parse doesn't
      // poison the queue for the next caller.
      queueRef.current = next.catch(() => {});
      return next;

      async function parseOnce(f: File): Promise<StlParseResult> {
        setIsLoading(true);
        setError(null);
        const worker = ensureWorker();
        const buffer = await f.arrayBuffer();
        const settled = new Promise<StlParseResult>((resolve, reject) => {
          const onMessage = (event: MessageEvent<StlWorkerMessage>) => {
            cleanup();
            if (event.data.ok) {
              resolve(event.data.result);
            } else {
              reject(event.data.error);
            }
          };
          const onError = (event: ErrorEvent) => {
            cleanup();
            reject({
              code: 'WORKER_ERROR',
              message: event.message || 'STL worker errored',
            } satisfies StlError);
          };
          const cleanup = () => {
            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);
          };
          worker.addEventListener('message', onMessage);
          worker.addEventListener('error', onError);
          worker.postMessage({ buffer }, [buffer]);
        });
        try {
          const r = await settled;
          setResult(r);
          setError(null);
          return r;
        } catch (e) {
          const err = isStlError(e)
            ? e
            : { code: 'PARSE_ERROR' as const, message: String(e) };
          setError(err);
          throw err;
        } finally {
          setIsLoading(false);
        }
      }
    },
    [ensureWorker]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, isLoading, parse, reset };
}

function isStlError(value: unknown): value is StlError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as { code: unknown }).code === 'string' &&
    typeof (value as { message: unknown }).message === 'string'
  );
}
