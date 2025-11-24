'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

export default function Breadcrumb({ className = '', customItems }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Define custom page names for better UX
  const pageNames: Record<string, string> = {
    '': 'Home',
    'dashboard': 'My Verdicts',
    'start': 'Create Request',
    'judge': 'Judge',
    'qualify': 'Qualification',
    'account': 'Account',
    'requests': 'Requests',
    'auth': 'Authentication',
    'login': 'Sign In',
    'signup': 'Sign Up',
    'welcome': 'Welcome',
    'waiting': 'Processing',
    'profile': 'Profile',
    'billing': 'Billing',
    'verdict': 'Verdict',
    'queue': 'Queue'
  };

  // Pages where breadcrumbs should be hidden
  const hiddenPaths = ['/', '/auth/login', '/auth/signup', '/welcome'];
  
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip UUID segments in breadcrumbs (for requests/[id] etc.)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        breadcrumbs.push({
          label: 'Details',
          href: currentPath
        });
        return;
      }

      const label = pageNames[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      breadcrumbs.push({
        label,
        href: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index === 0 && (
              <Home className="h-4 w-4 mr-1" />
            )}
            
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-700 truncate max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <>
                <Link 
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}