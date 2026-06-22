// Pure reducer + types for the /quote page state. No React, no DOM.
// Keep this testable in isolation — Task 10 doesn't ship tests for it,
// but the shape is small enough to verify by reading.

import type {
  Finish,
  LayerHeight,
  MaterialKey,
  PromoCode,
} from '@printgrid/pricing';
import type { StlParseResult } from '@/lib/stl-types';

export interface FileRowConfig {
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
}

export type ParseStatus =
  | { status: 'parsing' }
  | { status: 'done'; result: StlParseResult }
  | { status: 'error'; message: string };

export interface FileRow {
  id: string;
  fileName: string;
  fileSize: number;
  parse: ParseStatus;
  config: FileRowConfig;
}

export interface QuoteState {
  files: FileRow[];
  rush: boolean;
  promoInput: string;
  appliedPromo: PromoCode | null;
  promoError: string | null;
}

export const DEFAULT_CONFIG: FileRowConfig = {
  materialKey: 'pla-plus',
  layerHeight: '0.20',
  finish: 'as-printed',
  multicolor: false,
  qty: 1,
};

export const initialState: QuoteState = {
  files: [],
  rush: false,
  promoInput: '',
  appliedPromo: null,
  promoError: null,
};

export type Action =
  | { type: 'ADD_FILES'; payload: { id: string; file: File }[] }
  | { type: 'FILE_PARSED'; id: string; result: StlParseResult }
  | { type: 'FILE_PARSE_ERROR'; id: string; message: string }
  | {
      type: 'UPDATE_CONFIG';
      id: string;
      patch: Partial<FileRowConfig>;
    }
  | { type: 'REMOVE_FILE'; id: string }
  | { type: 'TOGGLE_RUSH' }
  | { type: 'SET_PROMO_INPUT'; value: string }
  | { type: 'APPLY_PROMO' }
  | { type: 'CLEAR_PROMO' };

const PROMO_KEYS: ReadonlySet<PromoCode> = new Set([
  'FIRSTPRINT',
  'DRONE25',
  'FOUNDER',
]);

const isPromo = (s: string): s is PromoCode =>
  PROMO_KEYS.has(s as PromoCode);

export function reducer(state: QuoteState, action: Action): QuoteState {
  switch (action.type) {
    case 'ADD_FILES': {
      const incoming: FileRow[] = action.payload.map(({ id, file }) => ({
        id,
        fileName: file.name,
        fileSize: file.size,
        parse: { status: 'parsing' },
        config: { ...DEFAULT_CONFIG },
      }));
      return { ...state, files: [...state.files, ...incoming] };
    }
    case 'FILE_PARSED': {
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, parse: { status: 'done', result: action.result } }
            : f
        ),
      };
    }
    case 'FILE_PARSE_ERROR': {
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, parse: { status: 'error', message: action.message } }
            : f
        ),
      };
    }
    case 'UPDATE_CONFIG': {
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, config: { ...f.config, ...action.patch } } : f
        ),
      };
    }
    case 'REMOVE_FILE': {
      return { ...state, files: state.files.filter((f) => f.id !== action.id) };
    }
    case 'TOGGLE_RUSH': {
      return { ...state, rush: !state.rush };
    }
    case 'SET_PROMO_INPUT': {
      return { ...state, promoInput: action.value, promoError: null };
    }
    case 'APPLY_PROMO': {
      const code = state.promoInput.trim().toUpperCase();
      if (!code) {
        return { ...state, promoError: 'Enter a code' };
      }
      if (isPromo(code)) {
        return { ...state, appliedPromo: code, promoError: null };
      }
      return {
        ...state,
        appliedPromo: null,
        promoError: 'That code does not match any active promo.',
      };
    }
    case 'CLEAR_PROMO': {
      return { ...state, appliedPromo: null, promoInput: '', promoError: null };
    }
    default:
      return state;
  }
}
