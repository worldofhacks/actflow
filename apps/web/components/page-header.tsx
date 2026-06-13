import React from 'react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
}
interface PageHeaderTitleProps {
  children?: React.ReactNode;
  className?: string;
}
interface PageHeaderDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}
const PageHeader: React.FC<PageHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col overflow-visible md:gap-4 mb-12 gap-3 justify-center md:items-start items-center motion-opacity-in-0 motion-blur-in-md',
        className,
      )}
    >
      {children}
    </div>
  );
};

const PageHeaderTitle: React.FC<PageHeaderTitleProps> = ({ children, className }) => {
  return (
    <h1
      className={cn(
        'font-onest overflow-visible font-semibold text-[47px] leading-tight tracking-[-0.01em] bg-gradient-to-r from-white to-white/75 text-transparent bg-clip-text flex items-center justify-center md:justify-start w-full   motion-translate-y-in-25',
        className,
      )}
    >
      {children}
    </h1>
  );
};

const PageHeaderDescription: React.FC<PageHeaderDescriptionProps> = ({ children, className }) => {
  return (
    <h3
      className={cn(
        'font-geist font-normal text-[21px] tracking-[-0.01em] text-gray-500 md:text-left text-center motion-blur-in-sm motion-opacity-in-0  motion-translate-y-in-4 motion-duration-500',
        className,
      )}
    >
      {children}
    </h3>
  );
};
export { PageHeader, PageHeaderDescription, PageHeaderTitle };
