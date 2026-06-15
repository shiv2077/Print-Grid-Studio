'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';
import styles from './Dropzone.module.css';

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 10;

export interface DropzoneProps {
  /** Number of files already accepted — used to enforce MAX_FILES total. */
  existingCount: number;
  onAccept: (files: File[]) => void;
}

export function Dropzone({ existingCount, onAccept }: DropzoneProps) {
  const [active, setActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = useCallback(
    (files: File[]): { ok: File[]; errs: string[] } => {
      const ok: File[] = [];
      const errs: string[] = [];
      const remaining = MAX_FILES - existingCount;
      for (const f of files) {
        if (ok.length >= remaining) {
          errs.push(
            `Only ${MAX_FILES} files per quote — extras dropped (${f.name})`
          );
          continue;
        }
        if (!/\.stl$/i.test(f.name)) {
          errs.push(`${f.name}: not an STL file`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          errs.push(
            `${f.name}: ${(f.size / 1024 / 1024).toFixed(1)}MB exceeds 100MB limit`
          );
          continue;
        }
        if (f.size === 0) {
          errs.push(`${f.name}: file is empty`);
          continue;
        }
        ok.push(f);
      }
      return { ok, errs };
    },
    [existingCount]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const { ok, errs } = validate(files);
      setErrors(errs);
      if (ok.length) onAccept(ok);
    },
    [onAccept, validate]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setActive(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setActive(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      handleFiles(files);
      // Reset so the same file can be re-uploaded if the user dismisses then re-adds
      e.target.value = '';
    },
    [handleFiles]
  );

  return (
    <div>
      <label
        className={clsx(styles.zone, active && styles.zoneActive)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <span className={styles.tag}>STEP 01 · UPLOAD</span>
        <p className={styles.heading}>Drop one or more STLs here.</p>
        <p className={styles.body}>
          Or click to browse · Max 100 MB each · Up to 10 files per quote
        </p>
        <input
          type="file"
          accept=".stl,model/stl,application/octet-stream"
          multiple
          onChange={onChange}
          className={styles.input}
          aria-label="Upload STL files"
        />
      </label>
      {errors.length > 0 && (
        <ul className={styles.errors} role="alert" aria-live="polite">
          {errors.map((e, i) => (
            <li key={i} className={styles.error}>
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
