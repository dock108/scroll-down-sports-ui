import type { ReactNode } from 'react';
import { getShortAppVersion } from '../../utils/env';

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  header?: ReactNode;
  headerClassName?: string;
};

export const PageLayout = ({
  children,
  className,
  contentClassName,
  header,
  headerClassName,
}: PageLayoutProps) => {
  const baseClassName = `mx-auto min-h-screen w-full max-w-[820px] px-6 py-12 sm:px-8 ${className ?? ''}`;
  const baseContentClassName = `space-y-8 ${contentClassName ?? ''}`;
  const baseHeaderClassName = `text-xs uppercase tracking-[0.4em] text-gray-400 ${headerClassName ?? ''}`;
  const version = getShortAppVersion();

  return (
    <main className={baseClassName.trim()}>
      {header ? <div className={baseHeaderClassName.trim()}>{header}</div> : null}
      <div className={baseContentClassName.trim()}>{children}</div>
      <footer className="mt-12 text-xs text-gray-400">
        Version <span className="font-mono">{version}</span>
      </footer>
    </main>
  );
};
