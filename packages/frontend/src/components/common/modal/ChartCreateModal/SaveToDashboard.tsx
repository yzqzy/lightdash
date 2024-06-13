import {
    DashboardTileTypes,
    getDefaultChartTileSize,
    type CreateChartInDashboard,
    type CreateDashboardChartTile,
    type CreateSavedChartVersion,
} from '@lightdash/common';
import { Button, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { uuid4 } from '@sentry/utils';
import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { z } from 'zod';
import { appendNewTilesToBottom } from '../../../../hooks/dashboard/useDashboard';
import useDashboardStorage from '../../../../hooks/dashboard/useDashboardStorage';
import useToaster from '../../../../hooks/toaster/useToaster';
import { useCreateMutation } from '../../../../hooks/useSavedQuery';

type Props = {
    dashboardName: string | null;
    dashboardUuid: string | null;
    savedData: CreateSavedChartVersion;
    projectUuid: string;
    onClose: () => void;
};

type SaveToDashboardFormValues = { name: string; description: string };

const validationSchema = z.object({
    name: z.string().nonempty(),
    description: z.string(),
});

type FormValues = z.infer<typeof validationSchema>;

export const SaveToDashboard: FC<Props> = ({
    savedData,
    dashboardName,
    dashboardUuid,
    projectUuid,
    onClose,
}) => {
    const [dashboardInfoFromStorage, setDashboardInfoFromStorage] = useState({
        name: dashboardName,
        dashboardUuid,
    });
    const { t } = useTranslation();
    const { getEditingDashboardInfo } = useDashboardStorage();
    const editingDashboardInfo = getEditingDashboardInfo();

    useEffect(() => {
        if (
            dashboardInfoFromStorage.name &&
            dashboardInfoFromStorage.dashboardUuid
        ) {
            return;
        }
        // retry getting dashboard info from storage if it's not available yet
        if (editingDashboardInfo.name && editingDashboardInfo.dashboardUuid) {
            setDashboardInfoFromStorage({
                name: editingDashboardInfo.name,
                dashboardUuid: editingDashboardInfo.dashboardUuid,
            });
        }
    }, [
        dashboardInfoFromStorage.dashboardUuid,
        dashboardInfoFromStorage.name,
        editingDashboardInfo.dashboardUuid,
        editingDashboardInfo.name,
    ]);

    const { showToastSuccess } = useToaster();
    const history = useHistory();

    const { mutateAsync: createChart } = useCreateMutation();
    const {
        clearIsEditingDashboardChart,
        getUnsavedDashboardTiles,
        setUnsavedDashboardTiles,
        getDashboardActiveTabUuid,
    } = useDashboardStorage();
    const unsavedDashboardTiles = getUnsavedDashboardTiles();
    const form = useForm<FormValues>({
        initialValues: {
            name: '',
            description: '',
        },
        validate: zodResolver(validationSchema),
    });

    const activeTabUuid = getDashboardActiveTabUuid();

    const handleSaveChartInDashboard = useCallback(
        async (values: SaveToDashboardFormValues) => {
            if (!dashboardUuid) {
                return;
            }
            const newChartInDashboard: CreateChartInDashboard = {
                ...savedData,
                name: values.name,
                description: values.description,
                dashboardUuid,
            };
            const chart = await createChart(newChartInDashboard);
            const newTile: CreateDashboardChartTile = {
                uuid: uuid4(),
                type: DashboardTileTypes.SAVED_CHART,
                tabUuid: activeTabUuid ?? undefined,
                properties: {
                    belongsToDashboard: true,
                    savedChartUuid: chart.uuid,
                    chartName: newChartInDashboard.name,
                },
                ...getDefaultChartTileSize(savedData.chartConfig?.type),
            };
            setUnsavedDashboardTiles(
                appendNewTilesToBottom(unsavedDashboardTiles ?? [], [newTile]),
            );

            clearIsEditingDashboardChart();
            history.push(
                `/projects/${projectUuid}/dashboards/${dashboardUuid}/edit`,
            );
            showToastSuccess({
                title: t('components_modal_chart_create.add.success', {
                    name: values.name,
                    dashboardName,
                }),
            });
        },
        [
            savedData,
            dashboardUuid,
            createChart,
            setUnsavedDashboardTiles,
            unsavedDashboardTiles,
            clearIsEditingDashboardChart,
            history,
            projectUuid,
            showToastSuccess,
            dashboardName,
            activeTabUuid,
            t,
        ],
    );
    return (
        <form
            onSubmit={form.onSubmit((values) =>
                handleSaveChartInDashboard(values),
            )}
        >
            <Stack p="md">
                <Stack spacing="xs">
                    <TextInput
                        label={t(
                            'components_modal_chart_create.add.form.name.label',
                        )}
                        placeholder={t(
                            'components_modal_chart_create.add.form.name.placeholder',
                        )}
                        required
                        {...form.getInputProps('name')}
                        data-testid="ChartCreateModal/NameInput"
                    />
                    <Textarea
                        label={t(
                            'components_modal_chart_create.add.form.description.label',
                        )}
                        placeholder={t(
                            'components_modal_chart_create.add.form.description.placeholder',
                        )}
                        autosize
                        maxRows={3}
                        {...form.getInputProps('description')}
                    />
                </Stack>
                <Stack spacing="xxs">
                    <Text fw={500}>
                        {t('components_modal_chart_create.add.saving_tip_1', {
                            dashboardName,
                        })}
                    </Text>
                    <Text fw={400} color="gray.6" fz="xs">
                        {t('components_modal_chart_create.add.saving_tip_2', {
                            dashboardName,
                        })}
                    </Text>
                </Stack>
            </Stack>

            <Group
                position="right"
                w="100%"
                sx={(theme) => ({
                    borderTop: `1px solid ${theme.colors.gray[4]}`,
                    bottom: 0,
                    padding: theme.spacing.md,
                })}
            >
                <Button onClick={onClose} variant="outline">
                    {t('components_modal_chart_create.add.cancel')}
                </Button>

                <Button type="submit" disabled={!form.values.name}>
                    {t('components_modal_chart_create.add.save')}
                </Button>
            </Group>
        </form>
    );
};
