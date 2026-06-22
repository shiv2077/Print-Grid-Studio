import clsx from 'clsx';
import styles from './Section.module.css';

export type SectionBg = 'paper' | 'paper-warm' | 'ink';

export interface SectionProps {
  bg?: SectionBg;
  gridPaper?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
  as?: 'section' | 'div' | 'header' | 'footer';
}

export function Section({
  bg = 'paper',
  gridPaper = false,
  className,
  children,
  id,
  as = 'section',
}: SectionProps) {
  const Tag = as;
  const bgClass =
    bg === 'paper-warm'
      ? styles.paperWarm
      : bg === 'ink'
      ? styles.ink
      : styles.paper;
  const gridClass = gridPaper
    ? bg === 'ink'
      ? 'grid-paper-on-ink'
      : 'grid-paper'
    : undefined;
  const inkClass = bg === 'ink' ? 'on-ink' : undefined;
  return (
    <Tag
      id={id}
      className={clsx(styles.section, bgClass, gridClass, inkClass, className)}
    >
      {children}
    </Tag>
  );
}
