import {
    type ApiError,
    type CreateSchedulerAndTargetsWithoutIds,
    type SchedulerAndTargets,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';

const getDashboardSchedulers = async (uuid: string) =>
    lightdashApi<SchedulerAndTargets[]>({
        url: `/dashboards/${uuid}/schedulers`,
        method: 'GET',
        body: undefined,
    });

export const useDashboardSchedulers = (dashboardUuid: string) =>
    useQuery<SchedulerAndTargets[], ApiError>({
        queryKey: ['dashboard_schedulers', dashboardUuid],
        queryFn: () => getDashboardSchedulers(dashboardUuid),
    });

const createDashboardScheduler = async (
    uuid: string,
    data: CreateSchedulerAndTargetsWithoutIds,
) =>
    lightdashApi<SchedulerAndTargets>({
        url: `/dashboards/${uuid}/schedulers`,
        method: 'POST',
        body: JSON.stringify(data),
    });

export const useDashboardSchedulerCreateMutation = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastApiError } = useToaster();

    return useMutation<
        SchedulerAndTargets,
        ApiError,
        { resourceUuid: string; data: CreateSchedulerAndTargetsWithoutIds }
    >(
        ({ resourceUuid, data }) =>
            createDashboardScheduler(resourceUuid, data),
        {
            mutationKey: ['create_dashboard_scheduler'],
            onSuccess: async (_, variables) => {
                await queryClient.invalidateQueries([
                    'dashboard_schedulers',
                    variables.resourceUuid,
                ]);
                showToastSuccess({
                    title: t(
                        'features_scheduler_hooks.dashboard_schedulers.success',
                    ),
                });
            },
            onError: ({ error }) => {
                showToastApiError({
                    title: t(
                        'features_scheduler_hooks.dashboard_schedulers.error',
                    ),
                    apiError: error,
                });
            },
        },
    );
};
