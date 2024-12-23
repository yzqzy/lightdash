import { type ApiError, type GitRepo } from '@lightdash/common';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Flex,
    Group,
    Loader,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconClock,
    IconRefresh,
    IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';
import useSearchParams from '../../../hooks/useSearchParams';
import githubIcon from '../../../svgs/github-icon.svg';
import MantineIcon from '../../common/MantineIcon';
import { SettingsGridCard } from '../../common/Settings/SettingsCard';

const getGithubRepositories = async () =>
    lightdashApi<GitRepo[]>({
        url: `/github/repos/list`,
        method: 'GET',
        body: undefined,
    });

const useGitHubRepositories = () => {
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useQuery<GitRepo[], ApiError>({
        queryKey: ['github_branches'],
        queryFn: () => getGithubRepositories(),
        retry: false,
        onError: ({ error }) => {
            if (error.statusCode === 404 || error.statusCode === 401) return; // Ignore missing installation errors or unauthorized in demo

            showToastApiError({
                title: t(
                    'components_user_settings_github_settings_panel.toast_error_get.title',
                ),
                apiError: error,
            });
        },
    });
};
const deleteGithubInstallation = async () =>
    lightdashApi<null>({
        url: `/github/uninstall`,
        method: 'DELETE',
        body: undefined,
    });

const useDeleteGithubInstallationMutation = () => {
    const { showToastSuccess, showToastApiError } = useToaster();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation<null, ApiError>(
        ['delete_github_installation'],
        () => deleteGithubInstallation(),
        {
            onSuccess: async () => {
                await queryClient.invalidateQueries(['github_branches']);
                showToastSuccess({
                    title: t(
                        'components_user_settings_github_settings_panel.toast_success.title',
                    ),
                    subtitle: t(
                        'components_user_settings_github_settings_panel.toast_success.subtitle',
                    ),
                });
            },
            onError: ({ error }) => {
                showToastApiError({
                    title: t(
                        'components_user_settings_github_settings_panel.toast_error.title',
                    ),
                    apiError: error,
                });
            },
        },
    );
};

const GITHUB_INSTALL_URL = `/api/v1/github/install`;

const GithubSettingsPanel: FC = () => {
    const { t } = useTranslation();
    const { data, isError, isInitialLoading } = useGitHubRepositories();
    const deleteGithubInstallationMutation =
        useDeleteGithubInstallationMutation();

    const status = useSearchParams('status');
    const { showToastWarning } = useToaster();
    const isWaitingForGithubRequest = status === 'github_request_sent';

    const isValidGithubInstallation = data !== undefined && !isError;

    useEffect(() => {
        if (
            isWaitingForGithubRequest &&
            !isValidGithubInstallation &&
            !isInitialLoading
        ) {
            const toastKey = 'github_request_sent';
            showToastWarning({
                title: t(
                    'components_user_settings_github_settings_panel.install_pending.title',
                ),
                subtitle: t(
                    'components_user_settings_github_settings_panel.install_pending.subtitle',
                ),
                key: toastKey,
            });
        }
    }, [
        isWaitingForGithubRequest,
        isValidGithubInstallation,
        isInitialLoading,
        showToastWarning,
        t,
    ]);

    if (isInitialLoading) {
        return <Loader />;
    }

    return (
        <SettingsGridCard>
            <Box>
                <Group spacing="sm">
                    <Avatar src={githubIcon} size="md" />
                    <Title order={4}>
                        {t(
                            'components_user_settings_github_settings_panel.title',
                        )}
                    </Title>
                </Group>
            </Box>

            <Stack>
                <Text color="dimmed" fz="xs">
                    {t(
                        'components_user_settings_github_settings_panel.content.part_1',
                    )}
                </Text>

                {isValidGithubInstallation && data.length === 0 && (
                    <Alert
                        color="blue"
                        icon={<MantineIcon icon={IconAlertCircle} />}
                    >
                        {t(
                            'components_user_settings_github_settings_panel.content.part_2',
                        )}
                    </Alert>
                )}
                {isValidGithubInstallation && data && data.length > 0 && (
                    <Text color="dimmed" fz="xs">
                        {t(
                            'components_user_settings_github_settings_panel.content.part_3',
                        )}
                        <ul>
                            {data.map((repo) => (
                                <li key={repo.fullName}>{repo.fullName}</li>
                            ))}
                        </ul>
                    </Text>
                )}

                {isValidGithubInstallation ? (
                    <Stack align="end">
                        <Group>
                            <Button
                                size="xs"
                                component="a"
                                target="_blank"
                                variant="default"
                                href={GITHUB_INSTALL_URL}
                                leftIcon={<MantineIcon icon={IconRefresh} />}
                                onClick={() => {
                                    deleteGithubInstallationMutation.mutate(
                                        undefined,
                                        {
                                            onSuccess: () => {
                                                window.open(
                                                    GITHUB_INSTALL_URL,
                                                    '_blank',
                                                );
                                            },
                                        },
                                    );
                                }}
                            >
                                {t(
                                    'components_user_settings_github_settings_panel.reinstall',
                                )}
                            </Button>
                            <Button
                                size="xs"
                                px="xs"
                                color="red"
                                variant="outline"
                                onClick={() =>
                                    deleteGithubInstallationMutation.mutate()
                                }
                                leftIcon={<MantineIcon icon={IconTrash} />}
                            >
                                {t(
                                    'components_user_settings_github_settings_panel.delete',
                                )}
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Flex justify="end">
                        {isWaitingForGithubRequest ? (
                            <Tooltip
                                multiline
                                maw={400}
                                label={t(
                                    'components_user_settings_github_settings_panel.waiting_for.label',
                                )}
                            >
                                <Button
                                    size="xs"
                                    component="a"
                                    target="_blank"
                                    color="yellow"
                                    variant="outline"
                                    href={GITHUB_INSTALL_URL}
                                    leftIcon={<MantineIcon icon={IconClock} />}
                                >
                                    {t(
                                        'components_user_settings_github_settings_panel.waiting_for.pending',
                                    )}
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button
                                size="xs"
                                component="a"
                                target="_blank"
                                color="blue"
                                href={GITHUB_INSTALL_URL}
                            >
                                {t(
                                    'components_user_settings_github_settings_panel.waiting_for.install',
                                )}
                            </Button>
                        )}
                    </Flex>
                )}
            </Stack>
        </SettingsGridCard>
    );
};

export default GithubSettingsPanel;
