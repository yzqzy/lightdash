import {
    type ApiError,
    type CreateSchedulerAndTargetsWithoutIds,
    type SchedulerAndTargets,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';

const getChartSchedulers = async (uuid: string) =>
    lightdashApi<SchedulerAndTargets[]>({
        url: `/saved/${uuid}/schedulers`,
        method: 'GET',
        body: undefined,
    });

export const useChartSchedulers = (chartUuid: string) =>
    useQuery<SchedulerAndTargets[], ApiError>({
        queryKey: ['chart_schedulers', chartUuid],
        queryFn: () => getChartSchedulers(chartUuid),
    });

const createChartScheduler = async (
    uuid: string,
    data: CreateSchedulerAndTargetsWithoutIds,
) =>
    lightdashApi<SchedulerAndTargets>({
        url: `/saved/${uuid}/schedulers`,
        method: 'POST',
        body: JSON.stringify(data),
    });

export const useChartSchedulerCreateMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useMutation<
        SchedulerAndTargets,
        ApiError,
        { resourceUuid: string; data: CreateSchedulerAndTargetsWithoutIds }
    >(({ resourceUuid, data }) => createChartScheduler(resourceUuid, data), {
        mutationKey: ['create_chart_scheduler'],
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries([
                'chart_schedulers',
                variables.resourceUuid,
            ]);
            showToastSuccess({
                title: t('features_scheduler_hooks.create_chart.success'),
            });
        },
        onError: ({ error }) => {
            showToastApiError({
                title: t('features_scheduler_hooks.create_chart.error'),
                apiError: error,
            });
        },
    });
};
