import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex px-5 py-2.5 rounded-xl text-sm backdrop-blur-sm font-light ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 placeholder:font-extralight  hover:border-act-2-purple-light focus:border-act-2-purple transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white bg-opacity-5 border-[1px] border-[#FFFFFF0D] focus:ring-0 focus:outline-none text-white ',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
