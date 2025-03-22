import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path: string;
}

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  'create-playlist': 'Create Playlist',
  playlists: 'My Playlists',
  settings: 'Settings',
  profile: 'Profile',
  privacy: 'Privacy',
  integrations: 'Integrations',
  notifications: 'Notifications',
  preferences: 'Preferences',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((path, index) => {
    const routePath = pathnames.slice(0, index + 1).join('/');
    return {
      name: routeMap[path] || path,
      path: `/${routePath}`,
    };
  });

  if (breadcrumbs.length === 0) {
    return (
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <div className="text-[#E8E8E8] font-medium">Dashboard</div>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={breadcrumb.path} className="flex items-center">
              {index > 0 && (
                <svg
                  className="mx-2 h-5 w-5 flex-shrink-0 text-[#666666]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              )}
              {isLast ? (
                <div className="text-[#E8E8E8] font-medium">
                  {breadcrumb.name}
                </div>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="text-[#666666] hover:text-[#E8E8E8]"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 