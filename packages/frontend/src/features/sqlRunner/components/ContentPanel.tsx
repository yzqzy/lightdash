import {
    ActionIcon,
    Box,
    Button,
    Divider,
    Group,
    Loader,
    Paper,
    Stack,
    Title,
    Tooltip,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
    IconAdjustmentsCog,
    IconLayoutNavbarCollapse,
    IconLayoutNavbarExpand,
    IconPlayerPlay,
} from '@tabler/icons-react';
import { useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableBox } from 'react-resizable';

import MantineIcon from '../../../components/common/MantineIcon';
import { useSqlQueryRun } from '../hooks/useSqlQueryRun';
import { useAppDispatch, useAppSelector } from '../store/hooks';

import { ChartKind } from '@lightdash/common';
import { setInitialResultsAndSeries, setSql } from '../store/sqlRunnerSlice';
import { SqlEditor } from './SqlEditor';
import BarChart from './visualizations/BarChart';
import { Table } from './visualizations/Table';

type Props = {
    isChartConfigOpen: boolean;
    openChartConfig: () => void;
    closeChartConfig: () => void;
};

const MIN_RESULTS_HEIGHT = 50;

export const ContentPanel: FC<Props> = ({
    isChartConfigOpen,
    openChartConfig,
    closeChartConfig,
}) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();

    const {
        ref: inputSectionRef,
        width: inputSectionWidth,
        height: inputSectionHeight,
    } = useElementSize();

    const { ref: wrapperRef, height: wrapperHeight } = useElementSize();
    const [resultsHeight, setResultsHeight] = useState(MIN_RESULTS_HEIGHT);
    const maxResultsHeight = useMemo(() => wrapperHeight - 58, [wrapperHeight]);
    const isResultsHeightMoreThanHalf = useMemo(
        () => resultsHeight > wrapperHeight / 2,
        [resultsHeight, wrapperHeight],
    );

    const sql = useAppSelector((state) => state.sqlRunner.sql);
    const selectedChartType = useAppSelector(
        (state) => state.sqlRunner.selectedChartType,
    );

    const {
        mutate: runSqlQuery,
        data: queryResults,
        isLoading,
    } = useSqlQueryRun({
        onSuccess: (data) => {
            if (data) {
                dispatch(setInitialResultsAndSeries(data));
                if (resultsHeight === MIN_RESULTS_HEIGHT) {
                    setResultsHeight(inputSectionHeight / 2);
                }
            }
        },
    });

    return (
        <Stack
            spacing="none"
            style={{ flex: 1, overflow: 'hidden' }}
            ref={wrapperRef}
        >
            <Tooltip.Group>
                <Paper shadow="none" radius={0} px="md" py="sm" withBorder>
                    <Group position="apart">
                        <Title order={5} c="gray.6">
                            {t('features_sql_runner_content_panel.sql_panel')}
                        </Title>
                        <Group spacing="md">
                            <Tooltip
                                key={String(isResultsHeightMoreThanHalf)}
                                variant="xs"
                                label={
                                    !isResultsHeightMoreThanHalf
                                        ? t(
                                              'features_sql_runner_content_panel.collapse',
                                          )
                                        : t(
                                              'features_sql_runner_content_panel.expand',
                                          )
                                }
                                position="bottom"
                            >
                                <ActionIcon
                                    size="xs"
                                    onClick={() =>
                                        setResultsHeight(
                                            isResultsHeightMoreThanHalf
                                                ? MIN_RESULTS_HEIGHT
                                                : maxResultsHeight,
                                        )
                                    }
                                >
                                    <MantineIcon
                                        icon={
                                            !isResultsHeightMoreThanHalf
                                                ? IconLayoutNavbarCollapse
                                                : IconLayoutNavbarExpand
                                        }
                                    />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip
                                variant="xs"
                                label={t(
                                    'features_sql_runner_content_panel.run_query',
                                )}
                                position="bottom"
                            >
                                <Button
                                    size="xs"
                                    leftIcon={
                                        <MantineIcon icon={IconPlayerPlay} />
                                    }
                                    loading={isLoading}
                                    onClick={() => {
                                        if (!sql) return;
                                        runSqlQuery({
                                            sql,
                                        });
                                    }}
                                >
                                    {t(
                                        'features_sql_runner_content_panel.run_query',
                                    )}
                                </Button>
                            </Tooltip>
                        </Group>
                    </Group>
                </Paper>
                <Paper
                    ref={inputSectionRef}
                    shadow="none"
                    radius={0}
                    p="none"
                    withBorder
                    style={{ flex: 1 }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            height: inputSectionHeight,
                            width: inputSectionWidth,
                        }}
                    >
                        <SqlEditor
                            sql={sql}
                            onSqlChange={(newSql) => dispatch(setSql(newSql))}
                        />
                    </Box>
                </Paper>
                <ResizableBox
                    height={resultsHeight}
                    minConstraints={[50, 50]}
                    maxConstraints={[Infinity, maxResultsHeight]}
                    resizeHandles={['n']}
                    axis="y"
                    handle={
                        <Divider
                            h={3}
                            bg="gray.3"
                            pos="absolute"
                            top={-2}
                            left={0}
                            right={0}
                            sx={{
                                cursor: 'ns-resize',
                            }}
                        />
                    }
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    onResizeStop={(e, data) =>
                        setResultsHeight(data.size.height)
                    }
                >
                    <Paper shadow="none" radius={0} px="md" py="sm" withBorder>
                        <Group position="apart">
                            <Group spacing="xs">
                                <Title order={5} c="gray.6">
                                    {t(
                                        'features_sql_runner_content_panel.results_chart_panel',
                                    )}
                                </Title>
                                {isLoading && <Loader size="xs" />}
                            </Group>

                            <Group spacing="md">
                                <Tooltip
                                    key={String(isResultsHeightMoreThanHalf)}
                                    variant="xs"
                                    label={
                                        isResultsHeightMoreThanHalf
                                            ? t(
                                                  'features_sql_runner_content_panel.collapse',
                                              )
                                            : t(
                                                  'features_sql_runner_content_panel.expand',
                                              )
                                    }
                                    position="bottom"
                                >
                                    <ActionIcon
                                        size="xs"
                                        onClick={() =>
                                            setResultsHeight(
                                                isResultsHeightMoreThanHalf
                                                    ? MIN_RESULTS_HEIGHT
                                                    : maxResultsHeight,
                                            )
                                        }
                                    >
                                        <MantineIcon
                                            icon={
                                                isResultsHeightMoreThanHalf
                                                    ? IconLayoutNavbarExpand
                                                    : IconLayoutNavbarCollapse
                                            }
                                        />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                    variant="xs"
                                    label={t(
                                        'features_sql_runner_content_panel.configure',
                                    )}
                                    position="bottom"
                                >
                                    <ActionIcon
                                        size="xs"
                                        onClick={
                                            isChartConfigOpen
                                                ? closeChartConfig
                                                : openChartConfig
                                        }
                                    >
                                        <MantineIcon
                                            icon={IconAdjustmentsCog}
                                        />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Group>
                    </Paper>

                    {queryResults && !isLoading && (
                        <Paper
                            shadow="none"
                            radius={0}
                            px="md"
                            py="sm"
                            withBorder
                            sx={{ flex: 1, overflow: 'auto' }}
                            h="100%"
                        >
                            {selectedChartType === ChartKind.TABLE && (
                                <Table data={queryResults} />
                            )}
                            {selectedChartType === ChartKind.VERTICAL_BAR && (
                                <BarChart data={queryResults} />
                            )}
                        </Paper>
                    )}
                </ResizableBox>
            </Tooltip.Group>
        </Stack>
    );
};
