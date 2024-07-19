import { ChartKind } from '@lightdash/common';
import {
    ActionIcon,
    Group,
    SegmentedControl,
    Stack,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { type Dispatch, type FC, type SetStateAction } from 'react';
import MantineIcon from '../../../components/common/MantineIcon';
import { EditableText } from '../../../components/VisualizationConfigs/common/EditableText';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setSelectedChartType,
    updateChartAxisLabel,
    updateChartSeriesLabel,
    updateTableChartFieldConfigLabel,
} from '../store/sqlRunnerSlice';

type Props = {
    setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export const RightSidebar: FC<Props> = ({ setSidebarOpen }) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();
    const tableChartConfig = useAppSelector(
        (state) => state.sqlRunner.tableChartConfig,
    );
    const chartConfig = useAppSelector(
        (state) => state.sqlRunner.barChartConfig,
    );
    const selectedChartType = useAppSelector(
        (state) => state.sqlRunner.selectedChartType,
    );

    return (
        <Stack h="100vh" spacing="xs">
            <Group position="apart">
                <Title order={5} fz="sm" c="gray.6">
                    {t('features_sql_runner_right_sidebar.configure_chart')}
                </Title>
                <Tooltip
                    variant="xs"
                    label={t('features_sql_runner_right_sidebar.close_sidebar')}
                    position="left"
                >
                    <ActionIcon size="xs">
                        <MantineIcon
                            icon={IconLayoutSidebarRightCollapse}
                            onClick={() => setSidebarOpen(false)}
                        />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <SegmentedControl
                size="xs"
                value={selectedChartType}
                onChange={(value: ChartKind) =>
                    dispatch(setSelectedChartType(value))
                }
                data={[
                    {
                        value: ChartKind.TABLE,
                        label: t('features_sql_runner_right_sidebar.table'),
                    },
                    {
                        value: ChartKind.VERTICAL_BAR,
                        label: t('features_sql_runner_right_sidebar.bar_chart'),
                    },
                ]}
            />

            {tableChartConfig && selectedChartType === ChartKind.TABLE && (
                <Stack spacing="xs">
                    {Object.keys(tableChartConfig.columns).map((reference) => (
                        <EditableText
                            key={reference}
                            value={tableChartConfig.columns[reference].label}
                            onChange={(e) => {
                                dispatch(
                                    updateTableChartFieldConfigLabel({
                                        reference: reference,
                                        label: e.target.value,
                                    }),
                                );
                            }}
                        />
                    ))}
                </Stack>
            )}
            {chartConfig && selectedChartType === ChartKind.VERTICAL_BAR && (
                <Stack spacing="xs">
                    <Title order={6} fz="sm" c="gray.6">
                        {t('features_sql_runner_right_sidebar.x_axis')}
                    </Title>
                    <EditableText
                        value={chartConfig?.axes?.x.label}
                        onChange={(e) => {
                            dispatch(
                                updateChartAxisLabel({
                                    reference: chartConfig.axes?.x.reference,
                                    label: e.target.value,
                                }),
                            );
                        }}
                    />
                    <Title order={6} fz="sm" c="gray.6">
                        {t('features_sql_runner_right_sidebar.y_axis')}
                    </Title>
                    <EditableText
                        value={chartConfig?.axes?.y[0]?.label}
                        onChange={(e) => {
                            dispatch(
                                updateChartAxisLabel({
                                    reference: chartConfig.axes?.y[0].reference,
                                    label: e.target.value,
                                }),
                            );
                        }}
                    />
                    <Title order={6} fz="sm" c="gray.6">
                        {t('features_sql_runner_right_sidebar.series')}
                    </Title>
                    {chartConfig.series &&
                        chartConfig.series.map(({ name, reference }, index) => (
                            <EditableText
                                key={reference}
                                value={name ?? reference}
                                onChange={(e) => {
                                    dispatch(
                                        updateChartSeriesLabel({
                                            index: index,
                                            name: e.target.value,
                                        }),
                                    );
                                }}
                            />
                        ))}
                </Stack>
            )}
        </Stack>
    );
};
