import {
    getDateFormat,
    TimeFrames,
    type OrganizationProject,
} from '@lightdash/common';
import { Avatar, Button, LoadingOverlay, Stack, Text } from '@mantine/core';
import { Prism } from '@mantine/prism';
import { IconChevronLeft, IconClock } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

import useToaster from '../../../hooks/toaster/useToaster';
import { useCreateAccessToken } from '../../../hooks/useAccessToken';
import { useProjects } from '../../../hooks/useProjects';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import MantineIcon from '../../common/MantineIcon';
import { ProjectCreationCard } from '../../common/Settings/SettingsCard';
import { OnboardingTitle } from './common/OnboardingTitle';
import OnboardingWrapper from './common/OnboardingWrapper';

interface ConnectUsingCliProps {
    siteUrl: string;
    version: string;
    onBack: () => void;
}

const ConnectUsingCLI: FC<ConnectUsingCliProps> = ({
    siteUrl,
    version,
    onBack,
}) => {
    const { t } = useTranslation();
    const history = useHistory();
    const initialProjectFetch = useRef(false);
    const existingProjects = useRef<OrganizationProject[]>();
    const { showToastSuccess } = useToaster();
    const queryClient = useQueryClient();
    const { track } = useTracking();

    useProjects({
        refetchInterval: 3000,
        refetchIntervalInBackground: true,
        staleTime: 0,
        onSuccess: async (newProjects) => {
            if (!initialProjectFetch.current) {
                existingProjects.current = newProjects;
                initialProjectFetch.current = true;
            }

            if (
                existingProjects.current &&
                existingProjects.current.length < newProjects.length
            ) {
                const uuids = newProjects.map((p) => p.projectUuid);
                const existingUuids = existingProjects.current.map(
                    (p) => p.projectUuid,
                );

                const newProjectUuid = uuids.find(
                    (uuid) => !existingUuids.includes(uuid),
                );

                await queryClient.invalidateQueries(['organization']);

                history.replace(
                    `/createProject/cli?projectUuid=${newProjectUuid}`,
                );
            }
        },
    });

    const {
        mutate: mutateAccessToken,
        data: tokenData,
        isLoading: isTokenCreating,
        isSuccess: isTokenCreated,
    } = useCreateAccessToken();

    useEffect(() => {
        if (isTokenCreated) return;

        const expiresAt = dayjs().add(30, 'days').toDate();
        const generatedAtString = dayjs().format(
            getDateFormat(TimeFrames.SECOND),
        );

        mutateAccessToken({
            expiresAt,
            description: `${t(
                'components_project_connection_flow.connect_using_cli.generated',
            )} ${generatedAtString}`,
            autoGenerated: true,
        });
    }, [mutateAccessToken, isTokenCreated, t]);

    const handleCopy = useCallback(() => {
        showToastSuccess({
            title: t(
                'components_project_connection_flow.connect_using_cli.commands_copied',
            ),
        });
        track({ name: EventName.COPY_CREATE_PROJECT_CODE_BUTTON_CLICKED });
    }, [showToastSuccess, track, t]);

    return (
        <OnboardingWrapper>
            <Button
                pos="absolute"
                variant="subtle"
                size="sm"
                top={-50}
                leftIcon={<MantineIcon icon={IconChevronLeft} />}
                onClick={onBack}
            >
                {t('components_project_connection_flow.connect_using_cli.back')}
            </Button>

            <ProjectCreationCard>
                <LoadingOverlay
                    visible={!isTokenCreated || isTokenCreating}
                    overlayBlur={2}
                />

                <Stack spacing="xl">
                    <Stack align="center" spacing="sm">
                        <Avatar size="lg" radius="xl">
                            <MantineIcon
                                icon={IconClock}
                                size="xxl"
                                strokeWidth={1.5}
                                color="black"
                            />
                        </Avatar>

                        <Stack spacing="xxs">
                            <OnboardingTitle>
                                {t(
                                    'components_project_connection_flow.connect_using_cli.content.part_1',
                                )}
                            </OnboardingTitle>

                            <Text>
                                {t(
                                    'components_project_connection_flow.connect_using_cli.content.part_2',
                                )}
                            </Text>
                        </Stack>
                    </Stack>

                    <Stack ta="left">
                        <Stack spacing="xs">
                            <Text fw={500}>
                                {t(
                                    'components_project_connection_flow.connect_using_cli.content.part_3',
                                )}
                            </Text>

                            <Prism
                                language="bash"
                                onCopy={handleCopy}
                                styles={{ copy: { right: 0 } }}
                            >
                                {`npm install -g @lightdash/cli@${version}`}
                            </Prism>
                        </Stack>

                        <Stack spacing="xs">
                            <Text fw={500}>
                                {t(
                                    'components_project_connection_flow.connect_using_cli.content.part_4',
                                )}
                            </Text>

                            <Prism
                                language="bash"
                                onCopy={handleCopy}
                                styles={{ copy: { right: 0 } }}
                            >
                                {`lightdash login ${siteUrl} --token ${tokenData?.token}`}
                            </Prism>
                        </Stack>

                        <Stack spacing="xs">
                            <Text fw={500}>
                                {t(
                                    'components_project_connection_flow.connect_using_cli.content.part_5',
                                )}
                            </Text>

                            <Prism
                                language="bash"
                                onCopy={handleCopy}
                                styles={{ copy: { right: 0 } }}
                            >
                                lightdash deploy --create
                            </Prism>
                        </Stack>
                    </Stack>
                </Stack>
            </ProjectCreationCard>

            <Button
                component="a"
                variant="subtle"
                mx="auto"
                w="fit-content"
                target="_blank"
                rel="noreferrer noopener"
                href="https://docs.lightdash.com/get-started/setup-lightdash/get-project-lightdash-ready"
                onClick={() => {
                    track({
                        name: EventName.DOCUMENTATION_BUTTON_CLICKED,
                        properties: {
                            action: 'getting_started',
                        },
                    });
                }}
            >
                {t(
                    'components_project_connection_flow.connect_using_cli.view_docs',
                )}
            </Button>
        </OnboardingWrapper>
    );
};

export default ConnectUsingCLI;
