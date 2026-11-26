import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-500">
      <ol className="flex items-center flex-wrap gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-indigo-600 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-slate-900 font-medium' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
