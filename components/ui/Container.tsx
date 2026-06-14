import clsx from 'clsx';
import styles from './Container.module.css';

export interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export function Container({ className, children }: ContainerProps) {
  return <div className={clsx(styles.container, className)}>{children}</div>;
}
