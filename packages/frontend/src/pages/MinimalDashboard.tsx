import type { DashboardTab } from '@lightdash/common';
import {
    assertUnreachable,
    DashboardTileTypes,
    isDashboardScheduler,
} from '@lightdash/common';
import { IconLayoutDashboard } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import SuboptimalState from '../components/common/SuboptimalState/SuboptimalState';
import {
    getReactGridLayoutConfig,
    getResponsiveGridLayoutProps,
} from '../components/DashboardTabs/gridUtils';
import ChartTile from '../components/DashboardTiles/DashboardChartTile';
import LoomTile from '../components/DashboardTiles/DashboardLoomTile';
import MarkdownTile from '../components/DashboardTiles/DashboardMarkdownTile';
import SemanticViewerChartTile from '../components/DashboardTiles/DashboardSemanticViewerChartTile';
import SqlChartTile from '../components/DashboardTiles/DashboardSqlChartTile';
import MinimalDashboardTabs from '../components/MinimalDashboardTabs';
import { useScheduler } from '../features/scheduler/hooks/useScheduler';
import { useDashboardQuery } from '../hooks/dashboard/useDashboard';
import { useDateZoomGranularitySearch } from '../hooks/useExplorerRoute';
import useSearchParams from '../hooks/useSearchParams';
import DashboardProvider from '../providers/Dashboard/DashboardProvider';
import '../styles/react-grid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const MinimalDashboard: FC = () => {
    const { t } = useTranslation();

    const { projectUuid, dashboardUuid, tabUuid } = useParams<{
        projectUuid: string;
        dashboardUuid: string;
        tabUuid?: string;
    }>();

    const schedulerUuid = useSearchParams('schedulerUuid');
    const sendNowSchedulerFilters = useSearchParams('sendNowSchedulerFilters');
    const schedulerTabs = useSearchParams('selectedTabs');
    const dateZoom = useDateZoomGranularitySearch();

    const {
        data: dashboard,
        isError: isDashboardError,
        error: dashboardError,
    } = useDashboardQuery(dashboardUuid);

    const [activeTab, setActiveTab] = useState<DashboardTab | null>(null);

    useEffect(() => {
        const matchedTab =
            dashboard?.tabs.find((tab) => tab.uuid === tabUuid) ??
            dashboard?.tabs[0];
        setActiveTab(matchedTab || null);
    }, [tabUuid, dashboard?.tabs]);

    const {
        data: scheduler,
        isError: isSchedulerError,
        error: schedulerError,
    } = useScheduler(schedulerUuid, {
        enabled: !!schedulerUuid && !sendNowSchedulerFilters,
    });

    const schedulerFilters = useMemo(() => {
        if (schedulerUuid && scheduler && isDashboardScheduler(scheduler)) {
            return scheduler.filters;
        }
        if (sendNowSchedulerFilters) {
            return JSON.parse(sendNowSchedulerFilters);
        }
        return undefined;
    }, [scheduler, schedulerUuid, sendNowSchedulerFilters]);

    const selectedTabs = useMemo(() => {
        if (schedulerTabs) {
            return JSON.parse(schedulerTabs);
        }
        return undefined;
    }, [schedulerTabs]);

    const generateTabUrl = useCallback(
        (tabId: string) =>
            `/minimal/projects/${projectUuid}/dashboards/${dashboardUuid}/view/tabs/${tabId}`,
        [projectUuid, dashboardUuid],
    );

    const sortedTabs = useMemo(
        () => dashboard?.tabs.sort((a, b) => a.order - b.order) ?? [],
        [dashboard?.tabs],
    );

    const tabsWithUrls = useMemo(() => {
        return sortedTabs.map((tab, index) => {
            const prevTab = sortedTabs[index - 1];
            const nextTab = sortedTabs[index + 1];

            return {
                ...tab,
                prevUrl: prevTab ? generateTabUrl(prevTab.uuid) : null,
                nextUrl: nextTab ? generateTabUrl(nextTab.uuid) : null,
                selfUrl: generateTabUrl(tab.uuid),
            };
        });
    }, [sortedTabs, generateTabUrl]);

    if (isDashboardError || isSchedulerError) {
        if (dashboardError) return <>{dashboardError.error.message}</>;
        if (schedulerError) return <>{schedulerError.error.message}</>;
    }

    if (!dashboard) {
        return <>{t('pages_minimal_dashboard.loading')}</>;
    }

    if (schedulerUuid && !scheduler) {
        return <>{t('pages_minimal_dashboard.loading')}</>;
    }

    if (dashboard.tiles.length === 0) {
        return <>{t('pages_minimal_dashboard.no_tiles')}</>;
    }

    const layouts = {
        lg: dashboard.tiles
            .filter(
                (tile) =>
                    (!selectedTabs || selectedTabs.includes(tile.tabUuid)) &&
                    (!activeTab || activeTab.uuid === tile.tabUuid),
            )
            .map<Layout>((tile) => getReactGridLayoutConfig(tile)),
    };

    const isTabEmpty =
        activeTab &&
        !dashboard.tiles.find((tile) => tile.tabUuid === activeTab.uuid);

    return (
        <DashboardProvider
            schedulerFilters={schedulerFilters}
            dateZoom={dateZoom}
        >
            {tabsWithUrls.length > 0 && (
                <MinimalDashboardTabs
                    tabs={tabsWithUrls}
                    activeTabId={activeTab?.uuid || null}
                />
            )}

            {isTabEmpty ? (
                <SuboptimalState
                    icon={IconLayoutDashboard}
                    title="Tab is empty"
                    sx={{ marginTop: '40px' }}
                />
            ) : (
                <ResponsiveGridLayout
                    {...getResponsiveGridLayoutProps({
                        stackVerticallyOnSmallestBreakpoint: true,
                    })}
                    layouts={layouts}
                >
                    {dashboard.tiles
                        .filter(
                            (tile) =>
                                (!selectedTabs ||
                                    selectedTabs.includes(tile.tabUuid)) &&
                                (!activeTab || activeTab.uuid === tile.tabUuid),
                        )
                        .map((tile) => (
                            <div key={tile.uuid}>
                                {tile.type ===
                                DashboardTileTypes.SAVED_CHART ? (
                                    <ChartTile
                                        key={tile.uuid}
                                        minimal
                                        tile={tile}
                                        isEditMode={false}
                                        onDelete={() => {}}
                                        onEdit={() => {}}
                                    />
                                ) : tile.type ===
                                  DashboardTileTypes.MARKDOWN ? (
                                    <MarkdownTile
                                        key={tile.uuid}
                                        tile={tile}
                                        isEditMode={false}
                                        onDelete={() => {}}
                                        onEdit={() => {}}
                                    />
                                ) : tile.type === DashboardTileTypes.LOOM ? (
                                    <LoomTile
                                        key={tile.uuid}
                                        tile={tile}
                                        isEditMode={false}
                                        onDelete={() => {}}
                                        onEdit={() => {}}
                                    />
                                ) : tile.type ===
                                  DashboardTileTypes.SQL_CHART ? (
                                    <SqlChartTile
                                        key={tile.uuid}
                                        tile={tile}
                                        isEditMode={false}
                                        onDelete={() => {}}
                                        onEdit={() => {}}
                                    />
                                ) : tile.type ===
                                  DashboardTileTypes.SEMANTIC_VIEWER_CHART ? (
                                    <SemanticViewerChartTile
                                        key={tile.uuid}
                                        tile={tile}
                                        isEditMode={false}
                                        onDelete={() => {}}
                                        onEdit={() => {}}
                                    />
                                ) : (
                                    assertUnreachable(
                                        tile,
                                        `Dashboard tile type is not recognised`,
                                    )
                                )}
                            </div>
                        ))}
                </ResponsiveGridLayout>
            )}
        </DashboardProvider>
    );
};

export default MinimalDashboard;
