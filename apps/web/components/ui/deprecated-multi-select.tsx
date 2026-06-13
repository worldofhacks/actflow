'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  itemClassName?: string;
  badgeClassName?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items',
  className,
  itemClassName,
  badgeClassName,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
    // Keep the dropdown open for multiple selections
    setIsOpen(true);
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value));
  };

  // Find the label for a selected value
  const getLabel = (value: string) => {
    return options.find(option => option.value === value)?.label || value;
  };

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input click without closing dropdown
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center rounded-xl border bg-white/5  px-5 py-2.5 text-sm text-white ring-offset-background focus-within:border-act-2-purple transition-colors duration-300',
          isOpen && 'border-act-2-purple',
          className,
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap items-center gap-1 w-full">
          {selected.length > 0 && (
            <>
              {selected.map(value => (
                <div
                  key={value}
                  className={cn(
                    'flex items-center gap-1 rounded-lg bg-act-2-purple-light px-2 py-1 text-xs text-white',
                    badgeClassName,
                  )}
                >
                  <span>{getLabel(value)}</span>
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full p-0 hover:bg-act-2-purple-light"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </>
          )}
          <div className="flex-1 flex items-center min-w-[120px] ml-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={handleInputClick}
              placeholder={selected.length === 0 ? placeholder : 'Search...'}
              className="flex-1 min-w-0 bg-transparent text-sm outline-none text-white placeholder:text-gray-400 placeholder:text-sm"
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full overflow-hidden rounded-xl border backdrop-blur-xl pointer-events-auto bg-black shadow-md">
          <div className="max-h-60 flex flex-col overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    'relative flex cursor-default select-none items-center  border border-transparent rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-300 outline-none hover:bg-act-base-dark hover:text-white focus:bg-act-base-dark focus:text-white',

                    itemClassName,
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {selected.includes(option.value) && <X className="h-3 w-3 text-act-2-purple" />}
                  </span>
                  {option.label}
                </div>
              ))
            ) : (
              <div className="py-2 px-4 text-sm text-gray-400">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
