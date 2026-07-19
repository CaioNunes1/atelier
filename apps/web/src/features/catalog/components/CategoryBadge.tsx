import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';

type CategoryBadgeProps = {
  name: string;
  slug: string;
  className?: string;
};

export function CategoryBadge({ name, slug, className }: CategoryBadgeProps) {
  return (
    <Link
      to={`/catalog?category=${encodeURIComponent(slug)}`}
      className={cn(
        'inline-flex items-center rounded-full border border-roseartisan-200 bg-roseartisan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-roseartisan-700 transition hover:border-roseartisan-300 hover:bg-roseartisan-100',
        className,
      )}
    >
      {name}
    </Link>
  );
}
