import { DimensionType } from '@lightdash/common';
import { Select, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { Config } from '../../../components/VisualizationConfigs/common/Config';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGroupFieldIds } from '../store/pieChartSlice';
import { TableFieldIcon } from './TableFields';

export const PieChartConfiguration = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const groupField = useAppSelector(
        (state) => state.pieChartConfig.config?.fieldConfig?.groupFieldIds?.[0],
    );
    const groupFieldOptions = useAppSelector(
        (state) => state.pieChartConfig.options.groupFieldOptions,
    );

    const sqlColumns = useAppSelector((state) => state.sqlRunner.sqlColumns);

    return (
        <Stack spacing="xs" mb="lg">
            <Title order={5} fz="sm" c="gray.9">
                {t('features_sql_runner_pie_chart_configuration.data')}
            </Title>
            {/* TODO: this select shares a lot with the other config field pickers
                Should we combine them?
            */}
            <Config.Section>
                <Config.Heading>
                    {t('features_sql_runner_pie_chart_configuration.group_by')}
                </Config.Heading>
                <Select
                    radius="md"
                    data={groupFieldOptions.map((x) => ({
                        value: x.reference,
                        label: x.reference,
                    }))}
                    value={groupField}
                    placeholder={t(
                        'features_sql_runner_pie_chart_configuration.select_x_axis',
                    )}
                    onChange={(value) => {
                        if (!value) return;
                        dispatch(setGroupFieldIds(value));
                    }}
                    error={
                        groupFieldOptions.find(
                            (x) => x.reference === groupField,
                        ) === undefined &&
                        t(
                            'features_sql_runner_pie_chart_configuration.select_x_axis',
                            {
                                field: groupField,
                            },
                        )
                    }
                    icon={
                        <TableFieldIcon
                            fieldType={
                                sqlColumns?.find(
                                    (x) => x.reference === groupField,
                                )?.type ?? DimensionType.STRING
                            }
                        />
                    }
                />
            </Config.Section>
        </Stack>
    );
};
