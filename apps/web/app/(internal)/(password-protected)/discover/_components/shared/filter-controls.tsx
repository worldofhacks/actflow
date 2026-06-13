'use client';
import { Icons } from '@/components/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AgentFilterRequest } from '@/types/agent/agent-filter';
import { Filter, Search, Sliders } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface FilterControlsProps {
  currentFilters: AgentFilterRequest;
  categories?: string[];
}

export const FilterControls = ({ currentFilters, categories }: FilterControlsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentFilters.name || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [isValidOnly, setIsValidOnly] = useState(!!currentFilters.isValid);

  // Handle debounced search for better UX
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Create a new URLSearchParams instance and update router
  const updateFilters = useCallback(
    (key: keyof AgentFilterRequest, value: string | boolean) => {
      setLoadingAgents(true);
      try {
        const params = new URLSearchParams(searchParams.toString());

        if (!value) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }

        // Update the URL with the new search parameters
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      } catch (error) {
        console.error('Error updating filters: ', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update filters. Please try again.',
        });
      } finally {
        setLoadingAgents(false);
      }
    },
    [router, searchParams, pathname],
  );
  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== currentFilters.name) {
      updateFilters('name', debouncedSearch);
    }
  }, [currentFilters.name, debouncedSearch, updateFilters]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleIsValidChange = (checked: boolean) => {
    setIsValidOnly(checked);
    updateFilters('isValid', checked);
  };

  return (
    <div className="mb-6 lg:mb-8 relative">
      {/* Loading Indicator */}
      {loadingAgents && (
        <div className="absolute right-4 top-4 z-10">
          <Icons.spinner className="h-6 w-6 animate-spin text-act-gold" />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4 lg:mb-8">
        <div className="absolute inset-y-0 left-0 z-10 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          className="w-full pl-10 h-11"
          placeholder="Search AI Agents by Name, Specialization, or Task Type"
          onChange={e => handleSearch(e.target.value)}
          value={searchQuery}
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="flex lg:hidden justify-between items-center mb-4">
        <button onClick={() => setShowFilters(!showFilters)} className="btn-outline px-4 py-2">
          <span className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </span>
        </button>
        <button className="btn-outline px-4 py-2">
          <span className="flex items-center">
            <Sliders className="h-4 w-4 mr-2" />
            Sort
          </span>
        </button>
      </div>

      {/* Filter Pills - Horizontal Scrollable on Mobile */}
      <div
        className={`overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 ${showFilters || 'hidden lg:block'}`}
      >
        <div className="flex space-x-3 lg:space-x-4 pb-4 lg:pb-0 min-w-max">
          <Select
            value={currentFilters.topic || ''}
            disabled={loadingAgents}
            onValueChange={value => updateFilters('topic', value)}
            defaultValue={currentFilters.topic || ''}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null as never}>All Categories</SelectItem>
              {categories?.length === 0 && (
                <SelectItem value={null as never}>No categories found</SelectItem>
              )}
              {categories?.length &&
                categories.length > 0 &&
                categories?.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.serviceType || ''}
            disabled={loadingAgents}
            onValueChange={value => updateFilters('serviceType', value)}
            defaultValue={currentFilters.serviceType || ''}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Service Options" />
            </SelectTrigger>
            <SelectContent>
              {/* TODO: Add service options after getting directions from backend for now just add `post` */}
              <SelectItem value={null as never}>All Services</SelectItem>
              <SelectItem value={'post'}>Post</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.minBudget || ''}
            disabled={loadingAgents}
            onValueChange={value => updateFilters('minBudget', value)}
            defaultValue={currentFilters.minBudget || ''}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              {/* TODO: Add service options after getting directions from backend for now just add `any` */}
              <SelectItem value={null as never}>Any</SelectItem>
              {/* {BUDGET_RANGE.map(budget => (
                <SelectItem key={budget.value} value={budget.value}>
                  {budget.label}
                </SelectItem>
              ))} */}
            </SelectContent>
          </Select>

          {/* Valid Agents Only Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isValid"
              checked={isValidOnly}
              onCheckedChange={handleIsValidChange}
              disabled={loadingAgents}
            />
            <Label htmlFor="isValid" className="text-sm cursor-pointer">
              Valid Agents Only
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
