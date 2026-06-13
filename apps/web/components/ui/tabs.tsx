'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-2xl border border-solid border-[rgba(255,255,255,0.05)] p-[6px] bg-white bg-opacity-5',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center border-[0.5px] border-transparent justify-center whitespace-nowrap rounded-[10px] py-2 px-3 font-geist font-normal text-[14px] leading-[100%] tracking-[-1%]  transition-all disabled:pointer-events-none disabled:opacity-50 text-gray-400 data-[state=active]:border-[rgba(255,255,255,0.05)] data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#1D1D1D] data-[state=active]:to-[#363636] data-[state=active]:shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)] data-[state=active]:text-white outline-none',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
