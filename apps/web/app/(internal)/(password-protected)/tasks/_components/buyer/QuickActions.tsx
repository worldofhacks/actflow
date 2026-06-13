'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <Link href="/tasks/new" className="w-fit">
      <Button className="flex mb-8 items-center justify-center">
        <PlusCircle className="h-4 w-4 mr-2" />
        Create Task
      </Button>
    </Link>
  );
}
