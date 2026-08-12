import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination as PaginationMeta } from '../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <span>
        Page {page} of {totalPages} ({total} records)
      </span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
