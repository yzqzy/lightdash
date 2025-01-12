import {
    FilterType,
    getFilterTypeFromItem,
    type ConditionalOperator,
    type Dashboard,
    type DashboardFilterRule,
    type FilterableDimension,
    type SchedulerFilterRule,
} from '@lightdash/common';
import {
    ActionIcon,
    Center,
    Flex,
    Group,
    Loader,
    Select,
    Stack,
    Text,
    Tooltip,
    useMantineTheme,
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconPencil,
    IconRotate2,
} from '@tabler/icons-react';
import { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import FieldIcon from '../../../components/common/Filters/FieldIcon';
import FieldLabel from '../../../components/common/Filters/FieldLabel';
import FilterInputComponent from '../../../components/common/Filters/FilterInputs';
import {
    useConditionalRuleLabel,
    useFilterOperatorOptions,
} from '../../../components/common/Filters/FilterInputs/utils';
import FiltersProvider from '../../../components/common/Filters/FiltersProvider';
import useFiltersContext from '../../../components/common/Filters/useFiltersContext';
import MantineIcon from '../../../components/common/MantineIcon';
import {
    hasSavedFilterValueChanged,
    isFilterEnabled,
} from '../../../components/DashboardFilter/FilterConfiguration/utils';
import { useProject } from '../../../hooks/useProject';
import useDashboardContext from '../../../providers/Dashboard/useDashboardContext';

const FilterSummaryLabel: FC<
    { filterSummary: ReturnType<any> } & Record<'isDisabled', boolean>
> = ({ filterSummary, isDisabled }) => {
    const { t } = useTranslation();

    if (isDisabled) {
        return (
            <Text fw={400} span>
                <Text span color="gray.6">
                    {t('feature_scheduler_filters.is_any_value')}
                </Text>
            </Text>
        );
    }
    return (
        <Text fw={400} span>
            <Text span color="gray.7">
                {filterSummary?.operator}{' '}
            </Text>
            <Text fw={700} span>
                {filterSummary?.value}
            </Text>
        </Text>
    );
};

type SchedulerFilterItemProps = {
    dashboardFilter: DashboardFilterRule;
    schedulerFilter?: DashboardFilterRule;
    onChange: (schedulerFilter: SchedulerFilterRule) => void;
    onRevert: () => void;
    hasChanged: boolean;
};

const FilterItem: FC<SchedulerFilterItemProps> = ({
    dashboardFilter,
    schedulerFilter,
    onChange,
    onRevert,
    hasChanged,
}) => {
    const { t } = useTranslation();
    const getFilterOperatorOptions = useFilterOperatorOptions();

    const theme = useMantineTheme();
    const getConditionalRuleLabel = useConditionalRuleLabel();

    const { itemsMap } =
        useFiltersContext<Record<string, FilterableDimension>>();
    const field = itemsMap[dashboardFilter.target.fieldId];
    const [isEditing, setIsEditing] = useState(false);

    const filterType = useMemo(() => {
        return field ? getFilterTypeFromItem(field) : FilterType.STRING;
    }, [field]);

    const isDisabled = useMemo(
        () => Boolean((schedulerFilter ?? dashboardFilter).disabled),
        [schedulerFilter, dashboardFilter],
    );

    const filterOperatorOptions = useMemo(() => {
        return getFilterOperatorOptions(filterType);
    }, [filterType, getFilterOperatorOptions]);

    if (!field) {
        // show invalid dashboard filter
        return (
            <Group spacing="xs" align="flex-start" noWrap>
                <ActionIcon size="xs" disabled>
                    <MantineIcon icon={IconRotate2} />
                </ActionIcon>

                <Stack key={dashboardFilter.id} spacing="xs" w="100%">
                    <Group spacing="xs">
                        <MantineIcon
                            icon={IconAlertTriangle}
                            color="red.6"
                            style={{ color: theme.colors.red[6] }}
                        />
                        <Text span fw={500}>
                            {t('feature_scheduler_filters.invalid_filter')}
                        </Text>
                        <Text fw={400} span>
                            <Text span color="gray.6">
                                {t(
                                    'feature_scheduler_filters.toast_referernce',
                                )}
                            </Text>
                            <Text span> {dashboardFilter.target.fieldId}</Text>
                        </Text>
                    </Group>
                </Stack>
            </Group>
        );
    }

    return (
        <Group spacing="xs" align="flex-start" noWrap>
            <Tooltip
                label={t('feature_scheduler_filters.tooltip_filter.label')}
                fz="xs"
                disabled={!hasChanged}
            >
                <ActionIcon
                    size="xs"
                    disabled={!hasChanged}
                    onClick={() => {
                        if (isEditing) {
                            setIsEditing(false);
                        }
                        onRevert();
                    }}
                >
                    <MantineIcon icon={IconRotate2} />
                </ActionIcon>
            </Tooltip>

            <Stack key={dashboardFilter.id} spacing="xs" w="100%">
                <Group spacing="xs">
                    <FieldIcon item={field} />
                    <FieldLabel
                        item={{
                            ...field,
                            label: dashboardFilter.label ?? field.label,
                        }}
                        hideTableName
                    />

                    <>
                        {isEditing || hasChanged ? null : (
                            <FilterSummaryLabel
                                filterSummary={getConditionalRuleLabel(
                                    schedulerFilter ?? dashboardFilter,
                                    field,
                                )}
                                isDisabled={isDisabled}
                            />
                        )}

                        <ActionIcon
                            size="xs"
                            disabled={isEditing || hasChanged}
                            onClick={() => {
                                setIsEditing(true);
                            }}
                        >
                            <MantineIcon icon={IconPencil} />
                        </ActionIcon>
                    </>
                </Group>

                {(isEditing || hasChanged) && (
                    <Flex gap="xs">
                        <Select
                            style={{
                                flex: '0 0 180px',
                            }}
                            size="xs"
                            value={
                                schedulerFilter?.operator ??
                                dashboardFilter.operator
                            }
                            data={filterOperatorOptions}
                            onChange={(operator: ConditionalOperator) => {
                                onChange({
                                    ...dashboardFilter,
                                    operator,
                                    tileTargets: undefined,
                                });
                            }}
                            withinPortal
                        />

                        <FilterInputComponent
                            filterType={filterType}
                            field={field}
                            rule={schedulerFilter ?? dashboardFilter}
                            onChange={(newFilter) => {
                                onChange({
                                    ...newFilter,
                                    tileTargets: undefined,
                                });
                            }}
                            popoverProps={{ withinPortal: true }}
                        />
                    </Flex>
                )}
            </Stack>
        </Group>
    );
};

const isFilterReverted = (
    originalFilter: DashboardFilterRule,
    schedulerFilter: SchedulerFilterRule,
) => !hasSavedFilterValueChanged(originalFilter, schedulerFilter);

const hasFilterChanged = (
    filterToCompareAgainst: DashboardFilterRule | SchedulerFilterRule,
    schedulerFilter: SchedulerFilterRule,
) => hasSavedFilterValueChanged(filterToCompareAgainst, schedulerFilter);

const updateFilters = (
    schedulerFilter: SchedulerFilterRule,
    originalFilter: DashboardFilterRule,
    schedulerFilters: SchedulerFilterRule[] | undefined,
): SchedulerFilterRule[] | undefined => {
    if (
        schedulerFilters &&
        // Check if filters are the same, regardless of disabled state (accepts any value)
        isFilterReverted(
            { ...originalFilter, disabled: undefined },
            { ...schedulerFilter, disabled: undefined },
        )
    ) {
        return schedulerFilters.filter((f) => f.id !== schedulerFilter.id);
    }

    const filterIndex =
        schedulerFilters?.findIndex((f) => f.id === schedulerFilter.id) ?? -1;
    const isExistingFilter = filterIndex !== -1;

    const filterToCompareAgainst =
        schedulerFilters && isExistingFilter
            ? schedulerFilters[filterIndex]
            : originalFilter;

    if (hasFilterChanged(filterToCompareAgainst, schedulerFilter)) {
        if (schedulerFilters && isExistingFilter) {
            return schedulerFilters.map((f) =>
                f.id === schedulerFilter.id
                    ? {
                          ...schedulerFilter,
                          disabled: !isFilterEnabled(schedulerFilter),
                      }
                    : f,
            );
        }

        return [
            ...(schedulerFilters ?? []),
            {
                ...schedulerFilter,
                disabled: !isFilterEnabled(schedulerFilter),
            },
        ];
    }
};

type SchedulerFiltersProps = {
    dashboard?: Dashboard;
    onChange: (schedulerFilters: SchedulerFilterRule[]) => void;
    schedulerFilters: SchedulerFilterRule[] | undefined;
};

const SchedulerFilters: FC<SchedulerFiltersProps> = ({
    dashboard,
    schedulerFilters,
    onChange,
}) => {
    const { t } = useTranslation();
    const { data: project, isInitialLoading } = useProject(
        dashboard?.projectUuid,
    );
    const isLoadingDashboardFilters = useDashboardContext(
        (c) => c.isLoadingDashboardFilters,
    );
    const allFilters = useDashboardContext((c) => c.allFilters);
    const allFilterableFieldsMap = useDashboardContext(
        (c) => c.allFilterableFieldsMap,
    );
    const originalDashboardFilters = dashboard?.filters;
    const dashboardFilterIds = useMemo(
        () => new Set(dashboard?.filters.dimensions.map((f) => f.id)),
        [dashboard?.filters.dimensions],
    );

    const [schedulerFiltersData, setSchedulerFiltersData] = useState<
        SchedulerFilterRule[] | undefined
        // NOTE: Filter out any filters that are not in the dashboard anymore
    >(schedulerFilters?.filter((sf) => dashboardFilterIds.has(sf.id)));

    const handleUpdateSchedulerFilter = useCallback(
        (schedulerFilter: SchedulerFilterRule) => {
            if (!originalDashboardFilters) return;

            const originalFilter = originalDashboardFilters.dimensions.find(
                (d) => d.id === schedulerFilter.id,
            );

            if (!originalFilter) return;

            const updatedFilters = updateFilters(
                schedulerFilter,
                originalFilter,
                schedulerFiltersData,
            );

            setSchedulerFiltersData(updatedFilters);
            onChange(
                updatedFilters?.map((f) => ({
                    ...f,
                    tileTargets: undefined,
                })) ?? [],
            );
        },
        [onChange, originalDashboardFilters, schedulerFiltersData],
    );

    if (isInitialLoading || isLoadingDashboardFilters || !project) {
        return (
            <Center component={Stack} h={100}>
                <Loader color="gray" />
                <Text color="dimmed">
                    {t('feature_scheduler_filters.loading_dashboard_filters')}
                </Text>
            </Center>
        );
    }

    const revertFilter = (originalFilterId: string) => {
        const updatedFilters = schedulerFiltersData?.filter(
            (f) => f.id !== originalFilterId,
        );
        setSchedulerFiltersData(updatedFilters);
        onChange(
            updatedFilters?.map((f) => ({
                ...f,
                tileTargets: undefined,
            })) ?? [],
        );
    };

    return (
        <FiltersProvider<Record<string, FilterableDimension>>
            popoverProps={{ withinPortal: true }}
            projectUuid={project.projectUuid}
            itemsMap={allFilterableFieldsMap}
            startOfWeek={project.warehouseConnection?.startOfWeek ?? undefined}
            dashboardFilters={allFilters}
        >
            {dashboard && dashboard.filters.dimensions.length > 0 ? (
                <Stack>
                    {dashboard?.filters?.dimensions.map((filter) => {
                        const schedulerFilter = schedulerFiltersData?.find(
                            (sf) => sf.id === filter.id,
                        );

                        return (
                            <FilterItem
                                key={filter.id}
                                dashboardFilter={filter}
                                schedulerFilter={schedulerFilter}
                                onChange={handleUpdateSchedulerFilter}
                                onRevert={() => revertFilter(filter.id)}
                                hasChanged={
                                    schedulerFilter
                                        ? hasSavedFilterValueChanged(
                                              filter,
                                              schedulerFilter,
                                          )
                                        : false
                                }
                            />
                        );
                    })}
                </Stack>
            ) : (
                <Center component={Stack} h={100}>
                    <Text color="dimmed">
                        {t('feature_scheduler_filters.no_filters')}
                    </Text>
                </Center>
            )}
        </FiltersProvider>
    );
};

export default SchedulerFilters;
