import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl border-[1px]   px-5 py-2.5 focus:outline-none bg-white/5  transition-all  focus:border-act-2-purple focus:ring-0  backdrop-blur-sm hover:border-act-2-purple-light text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50  text-white',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
