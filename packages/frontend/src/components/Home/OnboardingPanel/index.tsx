import { Card, Group, Paper, Stack, Text, Title } from '@mantine/core';
import React, { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import Step1 from '../../../svgs/onboarding1.svg';
import Step2 from '../../../svgs/onboarding2.svg';
import Step3 from '../../../svgs/onboarding3.svg';
import { EventName } from '../../../types/Events';
import MantineLinkButton from '../../common/MantineLinkButton';

interface Props {
    projectUuid: string;
    userName?: string;
}


const OnboardingPanel: FC<Props> = ({ projectUuid, userName }) => {
    const { t } = useTranslation()
        
    const onboardingSteps = [
        {
            title: t('components_onboarding_panel.steps.step1.title'),
            description:  t('components_onboarding_panel.steps.step1.description'),
            image: <img src={Step1} alt="onboarding-step-1" />,
        },
        {
            title: t('components_onboarding_panel.steps.step2.title'),
            description: t('components_onboarding_panel.steps.step2.description'),
            image: <img src={Step2} alt="onboarding-step-2" />,
        },
        {
            title:  t('components_onboarding_panel.steps.step3.title'),
            description:t('components_onboarding_panel.steps.step3.description'),
            image: <img src={Step3} alt="onboarding-step-3" />,
        },
    ];

    return (
        <Stack justify="flex-start" spacing="xs" mt="4xl">
            <Title order={3}>
                {`${t('welcome')}${userName ? ', ' + userName : ' to Lightdash'}! 👋`}
            </Title>
            <Text color="gray.7">
                {t('components_onboarding_panel.exploring')}
            </Text>
            <Paper withBorder p="xl" mt="lg">
                <Group position="center">
                    {onboardingSteps.map((step) => (
                        <Card key={step.title} mx="xl">
                            <Card.Section mx="lg" p="md">
                                {step.image}
                            </Card.Section>
                            <Title order={5} fw={500} ta="center">
                                {step.title}
                            </Title>
                            <Text size="sm" color="gray.6" ta="center">
                                {step.description}
                            </Text>
                        </Card>
                    ))}
                    <MantineLinkButton
                        href={`/projects/${projectUuid}/tables`}
                        trackingEvent={{
                            name: EventName.ONBOARDING_STEP_CLICKED,
                            properties: {
                                action: 'run_query',
                            },
                        }}
                        my="xl"
                    >
                       {t('components_onboarding_panel.query')}
                    </MantineLinkButton>
                </Group>
            </Paper>
        </Stack>
    );
};

export default OnboardingPanel;
