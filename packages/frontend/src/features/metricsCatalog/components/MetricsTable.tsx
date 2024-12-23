import {
    assertUnreachable,
    MAX_METRICS_TREE_NODE_COUNT,
    type CatalogItem,
} from '@lightdash/common';
import {
    Box,
    Divider,
    Group,
    Paper,
    Text,
    useMantineTheme,
    type PaperProps,
} from '@mantine/core';
import {
    IconArrowDown,
    IconArrowsSort,
    IconArrowUp,
} from '@tabler/icons-react';
import { useIsMutating } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_SortingState,
    type MRT_Virtualizer,
} from 'mantine-react-table';
import {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
    type UIEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon from '../../../components/common/MantineIcon';
import SuboptimalState from '../../../components/common/SuboptimalState/SuboptimalState';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import { useAppDispatch, useAppSelector } from '../../sqlRunner/store/hooks';
import {
    MIN_METRICS_CATALOG_SEARCH_LENGTH,
    useMetricsCatalog,
} from '../hooks/useMetricsCatalog';
import { useMetricsTree } from '../hooks/useMetricsTree';
import {
    setCategoryFilters,
    toggleMetricPeekModal,
} from '../store/metricsCatalogSlice';
import { MetricPeekModal } from './MetricPeekModal';
import { useMetriCatalogColumns } from './MetricsCatalogColumns';
import {
    MetricCatalogView,
    MetricsTableTopToolbar,
} from './MetricsTableTopToolbar';
import MetricTree from './MetricTree';

export const MetricsTable = () => {
    const { t } = useTranslation();
    const metricsCatalogColumns = useMetriCatalogColumns();

    const { track } = useTracking();
    const dispatch = useAppDispatch();
    const theme = useMantineTheme();

    const projectUuid = useAppSelector(
        (state) => state.metricsCatalog.projectUuid,
    );
    const organizationUuid = useAppSelector(
        (state) => state.metricsCatalog.organizationUuid,
    );
    const categoryFilters = useAppSelector(
        (state) => state.metricsCatalog.categoryFilters,
    );
    const { canManageTags, canManageMetricsTree } = useAppSelector(
        (state) => state.metricsCatalog.abilities,
    );
    const isMetricPeekModalOpen = useAppSelector(
        (state) => state.metricsCatalog.modals.metricPeekModal.isOpen,
    );

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const rowVirtualizerInstanceRef =
        useRef<MRT_Virtualizer<HTMLDivElement, HTMLTableRowElement>>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);
    const deferredSearch = useDeferredValue(search);
    const [metricCatalogView, setMetricCatalogView] =
        useState<MetricCatalogView>(MetricCatalogView.LIST);

    // Enable sorting by highest popularity(how many charts use the metric) by default
    const initialSorting = [
        {
            id: 'chartUsage',
            desc: true,
        },
    ];

    const [sorting, setSorting] = useState<MRT_SortingState>(initialSorting);

    const onCloseMetricPeekModal = () => {
        dispatch(toggleMetricPeekModal(undefined));
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isLoading,
        isPreviousData,
    } = useMetricsCatalog({
        projectUuid,
        pageSize: 50,
        search: deferredSearch,
        categories: categoryFilters,
        // TODO: Handle multiple sorting - this needs to be enabled and handled later in the backend
        ...(sorting.length > 0 && {
            sortBy: sorting[0].id as keyof CatalogItem,
            sortDirection: sorting[0].desc ? 'desc' : 'asc',
        }),
    });

    useEffect(() => {
        if (
            deferredSearch &&
            deferredSearch.length > MIN_METRICS_CATALOG_SEARCH_LENGTH &&
            data
        ) {
            track({
                name: EventName.METRICS_CATALOG_SEARCH_APPLIED,
                properties: {
                    organizationId: organizationUuid,
                    projectId: projectUuid,
                },
            });
        }
    }, [deferredSearch, track, organizationUuid, projectUuid, data]);

    // Check if we are mutating any of the icons or categories related mutations
    // TODO: Move this to separate hook and utilise constants so this scales better
    const isMutating = useIsMutating({
        predicate: (mutation) => {
            const mutationKeys = [
                'create-tag',
                'update-tag',
                'delete-tag',
                'add-category',
                'remove-category',
                'update-catalog-item-icon',
            ];
            return Boolean(
                mutation.options.mutationKey?.some((key) =>
                    mutationKeys.includes(key as string),
                ),
            );
        },
    });

    //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
    const fetchMoreOnBottomReached = useCallback(
        (containerRefElement?: HTMLDivElement | null) => {
            if (containerRefElement) {
                const { scrollHeight, scrollTop, clientHeight } =
                    containerRefElement;
                //once the user has scrolled within 200px of the bottom of the table, fetch more data if we can
                if (
                    scrollHeight - scrollTop - clientHeight < 200 &&
                    !isFetching &&
                    hasNextPage
                ) {
                    void fetchNextPage();
                }
            }
        },
        [fetchNextPage, isFetching, hasNextPage],
    );

    // Check if we need to fetch more data on mount
    useEffect(() => {
        fetchMoreOnBottomReached(tableContainerRef.current);
    }, [fetchMoreOnBottomReached]);

    const handleViewChange = (view: MetricCatalogView) => {
        setMetricCatalogView(view);
    };

    const handleSetCategoryFilters = (selectedCategories: string[]) => {
        dispatch(setCategoryFilters(selectedCategories));

        // Track when categories are applied as filters
        if (selectedCategories.length > 0 && selectedCategories) {
            track({
                name: EventName.METRICS_CATALOG_CATEGORY_FILTER_APPLIED,
                properties: {
                    organizationId: organizationUuid,
                    projectId: projectUuid,
                },
            });
        }
    };

    // Reusable paper props to avoid duplicate when rendering tree view
    const mantinePaperProps: PaperProps = useMemo(
        () => ({
            shadow: undefined,
            sx: {
                border: `1px solid ${theme.colors.gray[2]}`,
                borderRadius: theme.spacing.sm, // ! radius doesn't have rem(12) -> 0.75rem
                boxShadow: theme.shadows.subtle,
                display: 'flex',
                flexDirection: 'column',
            },
        }),
        [theme],
    );

    const flatData = useMemo(
        () => data?.pages.flatMap((page) => page.data) ?? [],
        [data],
    );

    // Fetch metric tree data
    const selectedMetricUuids = useMemo(() => {
        return flatData.map((metric) => metric.catalogSearchUuid);
    }, [flatData]);

    const totalResults = useMemo(() => {
        if (!data) return 0;
        // Return total results from the last page, this should be the same but still we want to have the latest value
        const lastPage = data.pages[data.pages.length - 1];
        return lastPage.pagination?.totalResults ?? 0;
    }, [data]);

    const showLoadingOverlay = useMemo(
        () => isFetching && isPreviousData && !isMutating,
        [isFetching, isPreviousData, isMutating],
    );

    const isValidMetricsNodeCount =
        selectedMetricUuids.length > 0 &&
        selectedMetricUuids.length <= MAX_METRICS_TREE_NODE_COUNT;

    const { data: metricsTree } = useMetricsTree(
        projectUuid,
        selectedMetricUuids,
        {
            enabled: !!projectUuid && isValidMetricsNodeCount,
        },
    );

    // Viewers cannot access metrics tree if there are no edges
    const isValidMetricsEdgeCount = useMemo(
        () => canManageMetricsTree || (metricsTree?.edges.length ?? 0) > 0,
        [canManageMetricsTree, metricsTree],
    );

    const isValidMetricsTree = useMemo(
        () => isValidMetricsNodeCount && isValidMetricsEdgeCount,
        [isValidMetricsNodeCount, isValidMetricsEdgeCount],
    );

    const segmentedControlTooltipLabel = useMemo(() => {
        if (totalResults === 0) {
            return t('features_metrics.table.tooltip_control.part_1');
        }

        if (!isValidMetricsNodeCount) {
            return t('features_metrics.table.tooltip_control.part_2');
        }

        if (!isValidMetricsEdgeCount) {
            return t('features_metrics.table.tooltip_control.part_3');
        }
    }, [isValidMetricsEdgeCount, isValidMetricsNodeCount, totalResults, t]);

    const dataHasCategories = useMemo(() => {
        return flatData.some((item) => item.categories?.length);
    }, [flatData]);

    const table = useMantineReactTable({
        columns: metricsCatalogColumns,
        data: flatData,
        enableColumnResizing: true,
        enableRowNumbers: false,
        positionActionsColumn: 'last',
        enableRowVirtualization: true,
        enablePagination: false,
        enableFilters: true,
        enableFullScreenToggle: false,
        enableDensityToggle: false,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableHiding: false,
        enableGlobalFilterModes: false,
        onGlobalFilterChange: (s: string) => {
            setSearch(s);
        },
        manualFiltering: true,
        enableFilterMatchHighlighting: true,
        enableSorting: true,
        manualSorting: true,
        onSortingChange: setSorting,
        enableTopToolbar: true,
        positionGlobalFilter: 'left',
        mantinePaperProps,
        mantineTableContainerProps: {
            ref: tableContainerRef,
            sx: {
                maxHeight: 'calc(100dvh - 350px)',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
            },
            onScroll: (event: UIEvent<HTMLDivElement>) =>
                fetchMoreOnBottomReached(event.target as HTMLDivElement),
        },
        mantineTableProps: {
            highlightOnHover: true,
            withColumnBorders: Boolean(flatData.length),
            sx: {
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
            },
        },
        mantineTableHeadProps: {
            sx: {
                flexShrink: 1,
            },
        },
        mantineTableHeadRowProps: {
            sx: {
                boxShadow: 'none',

                // Each head row has a divider when resizing columns is enabled
                'th > div > div:last-child': {
                    height: 40,
                    top: -10,
                    right: -5,
                },

                'th > div > div:last-child > .mantine-Divider-root': {
                    border: 'none',
                },
            },
        },
        mantineTableHeadCellProps: (props) => {
            const isAnyColumnResizing = props.table
                .getAllColumns()
                .some((c) => c.getIsResizing());

            const isLastColumn =
                props.table.getAllColumns().indexOf(props.column) ===
                props.table.getAllColumns().length - 1;

            return {
                bg: 'gray.0',
                h: '3xl',
                pos: 'relative',
                // Adding to inline styles to override the default ones which can't be overridden with sx
                style: {
                    padding: `${theme.spacing.xs} ${theme.spacing.xl}`,
                    borderBottom: `1px solid ${theme.colors.gray[2]}`,
                    borderRight: props.column.getIsResizing()
                        ? `2px solid ${theme.colors.blue[3]}`
                        : `1px solid ${
                              isLastColumn
                                  ? 'transparent'
                                  : theme.colors.gray[2]
                          }`,
                    borderTop: 'none',
                    borderLeft: 'none',
                },
                sx: {
                    justifyContent: 'center',
                    'tr > th:last-of-type': {
                        borderLeft: `2px solid ${theme.colors.blue[3]}`,
                    },
                    '&:hover': {
                        borderRight: !isAnyColumnResizing
                            ? `2px solid ${theme.colors.blue[3]} !important` // This is needed to override the default inline styles
                            : undefined,
                        transition: `border-right ${theme.other.transitionDuration}ms ${theme.other.transitionTimingFunction}`,
                    },
                },
            };
        },
        mantineTableBodyProps: {
            sx: {
                flexGrow: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // This is needed to remove the bottom border of the last row when there are no rows (cell props are not used)
                // It doesn't work when there are rows because they more specific selectors for default styles, so TableBodyCellProps are used instead
                'tr:last-of-type > td': {
                    borderBottom: 'none',
                },
            },
        },
        mantineTableBodyRowProps: {
            sx: {
                'td:first-of-type > div > .explore-button-container': {
                    visibility: 'hidden',
                    opacity: 0,
                },
                '&:hover': {
                    td: {
                        backgroundColor: theme.colors.gray[0],
                        transition: `background-color ${theme.other.transitionDuration}ms ${theme.other.transitionTimingFunction}`,
                    },

                    'td:first-of-type > div > .explore-button-container': {
                        visibility: 'visible',
                        opacity: 1,
                        transition: `visibility 0ms, opacity ${theme.other.transitionDuration}ms ${theme.other.transitionTimingFunction}`,
                    },
                },
            },
        },
        mantineTableBodyCellProps: (props) => {
            const isLastColumn =
                props.table.getAllColumns().indexOf(props.column) ===
                props.table.getAllColumns().length - 1;

            const isLastRow = flatData.length === props.row.index + 1;
            const hasScroll = tableContainerRef.current
                ? tableContainerRef.current.scrollHeight >
                  tableContainerRef.current.clientHeight
                : false;

            return {
                h: 72,
                // Adding to inline styles to override the default ones which can't be overridden with sx
                style: {
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    borderRight: isLastColumn
                        ? 'none'
                        : `1px solid ${theme.colors.gray[2]}`,
                    // This is needed to remove the bottom border of the last row when there are rows
                    borderBottom:
                        isLastRow && hasScroll
                            ? 'none'
                            : `1px solid ${theme.colors.gray[2]}`,
                    borderTop: 'none',
                    borderLeft: 'none',
                },
                sx: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0,
                },
            };
        },
        renderTopToolbar: () => (
            <Box>
                <MetricsTableTopToolbar
                    search={search}
                    setSearch={setSearch}
                    totalResults={totalResults}
                    selectedCategories={categoryFilters}
                    setSelectedCategories={handleSetCategoryFilters}
                    position="apart"
                    p={`${theme.spacing.lg} ${theme.spacing.xl}`}
                    showCategoriesFilter={canManageTags || dataHasCategories}
                    onMetricCatalogViewChange={handleViewChange}
                    metricCatalogView={metricCatalogView}
                    isValidMetricsTree={isValidMetricsTree}
                    segmentedControlTooltipLabel={segmentedControlTooltipLabel}
                />
                <Divider color="gray.2" />
            </Box>
        ),
        renderBottomToolbar: () => (
            <Box
                p={`${theme.spacing.sm} ${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.xl}`}
                fz="xs"
                fw={500}
                color="gray.8"
                sx={{
                    borderTop: `1px solid ${theme.colors.gray[3]}`,
                }}
            >
                {isFetching ? (
                    <Text>
                        {t('features_metrics.table.bootom_toolbar.part_1')}
                    </Text>
                ) : (
                    <Group spacing="two">
                        <Text>
                            {hasNextPage
                                ? t(
                                      'features_metrics.table.bootom_toolbar.part_2',
                                  )
                                : t(
                                      'features_metrics.table.bootom_toolbar.part_3',
                                  )}
                        </Text>
                        <Text fw={400} color="gray.6">
                            {hasNextPage
                                ? t(
                                      'features_metrics.table.bootom_toolbar.part_4',
                                      {
                                          length: flatData.length,
                                      },
                                  )
                                : `(${flatData.length})`}
                        </Text>
                    </Group>
                )}
            </Box>
        ),
        icons: {
            IconArrowsSort: () => (
                <MantineIcon icon={IconArrowsSort} size="md" color="gray.5" />
            ),
            IconSortAscending: () => (
                <MantineIcon icon={IconArrowUp} size="md" color="blue.6" />
            ),
            IconSortDescending: () => (
                <MantineIcon icon={IconArrowDown} size="md" color="blue.6" />
            ),
        },
        state: {
            sorting,
            showProgressBars: false,
            showLoadingOverlay, // show loading overlay when fetching (like search, category filtering), but hide when editing rows.
            showSkeletons: isLoading, // loading for the first time with no data
            density: 'md',
            globalFilter: search ?? '',
        },
        mantineLoadingOverlayProps: {
            loaderProps: {
                color: 'violet',
            },
        },
        initialState: {
            showGlobalFilter: true, // Show search input by default
            columnVisibility: {
                categories: false,
            },
        },
        rowVirtualizerInstanceRef,
        rowVirtualizerProps: { overscan: 40 },
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: '',
            },
        },
        enableEditing: true,
        editDisplayMode: 'cell',
    });

    useEffect(() => {
        table.setColumnVisibility({
            categories: canManageTags || dataHasCategories,
        });
    }, [canManageTags, dataHasCategories, table]);

    switch (metricCatalogView) {
        case MetricCatalogView.LIST:
            return (
                <>
                    <MantineReactTable table={table} />
                    {isMetricPeekModalOpen && (
                        <MetricPeekModal
                            opened={isMetricPeekModalOpen}
                            onClose={onCloseMetricPeekModal}
                            metrics={flatData}
                        />
                    )}
                </>
            );
        case MetricCatalogView.TREE:
            return (
                <Paper {...mantinePaperProps}>
                    <Box>
                        <MetricsTableTopToolbar
                            search={search}
                            setSearch={setSearch}
                            totalResults={totalResults}
                            selectedCategories={categoryFilters}
                            setSelectedCategories={handleSetCategoryFilters}
                            position="apart"
                            p={`${theme.spacing.lg} ${theme.spacing.xl}`}
                            showCategoriesFilter={
                                canManageTags || dataHasCategories
                            }
                            onMetricCatalogViewChange={handleViewChange}
                            metricCatalogView={metricCatalogView}
                            isValidMetricsTree={isValidMetricsTree}
                            segmentedControlTooltipLabel={
                                segmentedControlTooltipLabel
                            }
                        />
                        <Divider color="gray.2" />
                    </Box>
                    <Box w="100%" h="calc(100dvh - 350px)">
                        <ReactFlowProvider>
                            {isValidMetricsTree ? (
                                <MetricTree
                                    metrics={flatData}
                                    edges={metricsTree?.edges ?? []}
                                    viewOnly={!canManageMetricsTree}
                                />
                            ) : (
                                <SuboptimalState
                                    title={t(
                                        'features_metrics.table.not_available.part_1',
                                    )}
                                    description={
                                        !isValidMetricsEdgeCount &&
                                        isValidMetricsNodeCount
                                            ? t(
                                                  'features_metrics.table.not_available.part_2',
                                              )
                                            : t(
                                                  'features_metrics.table.not_available.part_3',
                                              )
                                    }
                                />
                            )}
                        </ReactFlowProvider>
                    </Box>
                </Paper>
            );
        default:
            return assertUnreachable(
                metricCatalogView,
                t('features_metrics.table.not_available.part_4'),
            );
    }
};
