import React, { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EmptyState from '../common/EmptyState';

interface CommunityListProps<T> {
  items: T[];
  isLoading: boolean;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateAction: string;
  onEmptyStateAction: () => void;
  renderItem: (item: T) => ReactNode;
}

/**
 * Generic community content list with loading and empty states
 */
function CommunityList<T>({
  items,
  isLoading,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  onEmptyStateAction,
  renderItem
}: CommunityListProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyStateTitle}
        description={emptyStateDescription}
        action={
          <Button onClick={onEmptyStateAction}>
            <Plus className="mr-2 h-4 w-4" />
            {emptyStateAction}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default CommunityList;