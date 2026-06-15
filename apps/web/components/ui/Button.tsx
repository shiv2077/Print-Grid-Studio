import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'secondary', className, children, ...rest }, ref) {
    const variantClass =
      variant === 'primary'
        ? styles.primary
        : variant === 'ghost'
        ? styles.ghost
        : styles.secondary;
    return (
      <button
        ref={ref}
        className={clsx(styles.button, variantClass, className)}
        {...rest}
      >
        {children}
        {variant === 'ghost' && (
          <ChevronRight
            className={styles.ghostIcon}
            size={16}
            strokeWidth={2}
            aria-hidden
          />
        )}
      </button>
    );
  }
);
