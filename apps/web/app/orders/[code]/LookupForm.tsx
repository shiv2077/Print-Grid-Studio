'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './order.module.css';

export function LookupForm() {
  const router = useRouter();
  const [value, setValue] = useState('');

  return (
    <form
      className={styles.lookupForm}
      onSubmit={(e) => {
        e.preventDefault();
        const code = value.trim().toUpperCase();
        if (!code) return;
        router.push(`/orders/${code}`);
      }}
    >
      <input
        type="text"
        className={styles.lookupInput}
        placeholder="PG-XXXX-XXXX"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Order code"
      />
      <button type="submit" className={styles.lookupSubmit}>
        Look up
      </button>
    </form>
  );
}
