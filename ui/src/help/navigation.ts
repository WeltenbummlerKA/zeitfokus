// One shared help entry opens the topic relevant to the current workspace.
export const helpDestination = (pathname: string): string => {
    if (pathname.startsWith('/dashboard/')) {
        return '/help#dashboards';
    }
    const topics: Record<string, string> = {
        '/user/settings': 'settings',
        '/ai': 'ai',
        '/dashboards': 'dashboards',
        '/timesheet/list': 'recording',
        '/timesheet/calendar': 'history',
    };
    return topics[pathname] ? `/help#${topics[pathname]}` : '/help';
};
