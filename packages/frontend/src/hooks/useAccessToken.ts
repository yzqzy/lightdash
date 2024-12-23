import {
    type ApiCreateUserTokenResults,
    type ApiError,
    type CreatePersonalAccessToken,
    type PersonalAccessToken,
} from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseQueryOptions,
} from '@tanstack/react-query';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';
import useQueryError from './useQueryError';

// gets users access tokens
const getAccessToken = async () =>
    lightdashApi<any[]>({
        url: `/user/me/personal-access-tokens`,
        method: 'GET',
        body: undefined,
    });

const createAccessToken = async (data: CreatePersonalAccessToken) =>
    lightdashApi<ApiCreateUserTokenResults>({
        url: `/user/me/personal-access-tokens`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const deleteAccessToken = async (tokenUuid: string) =>
    lightdashApi<null>({
        url: `/user/me/personal-access-tokens/${tokenUuid}`,
        method: 'DELETE',
        body: undefined,
    });

export const useAccessToken = (
    useQueryOptions?: UseQueryOptions<PersonalAccessToken[], ApiError>,
) => {
    const setErrorResponse = useQueryError();
    return useQuery<PersonalAccessToken[], ApiError>({
        queryKey: ['personal_access_tokens'],
        queryFn: () => getAccessToken(),
        retry: false,
        onError: (result) => setErrorResponse(result),
        ...useQueryOptions,
    });
};

export const useCreateAccessToken = () => {
    const queryClient = useQueryClient();
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useMutation<
        ApiCreateUserTokenResults,
        ApiError,
        CreatePersonalAccessToken
    >((data) => createAccessToken(data), {
        mutationKey: ['personal_access_tokens'],
        retry: 3,
        onSuccess: async () => {
            await queryClient.invalidateQueries(['personal_access_tokens']);
        },
        onError: ({ error }) => {
            showToastApiError({
                title: t('hooks_access_token.toast_created'),
                apiError: error,
            });
        },
    });
};

export const useDeleteAccessToken = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useMutation<null, ApiError, string>(deleteAccessToken, {
        mutationKey: ['personal_access_tokens'],
        onSuccess: async () => {
            await queryClient.invalidateQueries(['personal_access_tokens']);
            showToastSuccess({
                title: t('hooks_access_token.toast_deleted'),
            });
        },
        onError: ({ error }) => {
            showToastApiError({
                title: t('hooks_access_token.toast_deleted_error'),
                apiError: error,
            });
        },
    });
};
