import { cn } from '@/lib/utils';
import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center w-auto h-[30px] rounded-2xl border-[0.5px] border-[rgba(63,61,66,1)] bg-[rgba(14,14,14,1)] py-2 px-3 gap-1.5 backdrop-blur-[48px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Tag.displayName = 'Tag';

export { Tag };
