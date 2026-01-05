import React, { Suspense } from 'react';

// Lazy load components often used in generative UI
const AnalyticsChart = React.lazy(() => import('../AnalyticsDashboard').then(mod => ({ default: () => <div className="p-4 bg-muted animate-pulse">Chart Loading...</div> }))); // Placeholder demo
const ActionCard = React.lazy(() => import('../ui/card').then(mod => ({ default: mod.Card })));

interface DynamicComponentProps {
    type: string;
    props: any;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    'chart': AnalyticsChart,
    'action-card': ActionCard,
    'alert': (props: any) => <div className="p-4 border border-yellow-500 bg-yellow-500/10 rounded-lg">{props.message}</div>,
};

/**
 * DynamicComponentRegistry (2026 Standards)
 * Allows the AI to "generate" UI by returning a JSON structure indicating 
 * which component to render and with what props.
 */
export const DynamicComponentRegistry: React.FC<DynamicComponentProps> = ({ type, props }) => {
    const Component = componentMap[type];

    if (!Component) {
        return <div className="p-2 text-xs text-muted-foreground">Unknown generative component: {type}</div>;
    }

    return (
        <Suspense fallback={<div className="h-20 w-full animate-pulse bg-muted rounded-lg" />}>
            <Component {...props} />
        </Suspense>
    );
};
