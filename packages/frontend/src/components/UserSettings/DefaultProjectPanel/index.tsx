import { ProjectType } from '@lightdash/common';
import { Button, Flex, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useOrganization } from '../../../hooks/organization/useOrganization';
import { useOrganizationUpdateMutation } from '../../../hooks/organization/useOrganizationUpdateMutation';
import { useProjects } from '../../../hooks/useProjects';

const validationSchema = z.object({
    defaultProjectUuid: z.string().or(z.undefined()),
});

type FormValues = z.infer<typeof validationSchema>;

const DefaultProjectPanel: FC = () => {
    const { isLoading: isOrganizationLoading, data: organizationData } =
        useOrganization();
    const { isLoading: isLoadingProjects, data: projects = [] } = useProjects();
    const { t } = useTranslation();

    const {
        isLoading: isOrganizationUpdateLoading,
        mutate: updateOrganization,
    } = useOrganizationUpdateMutation();

    const isLoading =
        isOrganizationUpdateLoading ||
        isOrganizationLoading ||
        isLoadingProjects;

    const form = useForm<FormValues>({
        initialValues: {
            defaultProjectUuid: undefined,
        },
    });

    useEffect(() => {
        if (isOrganizationLoading || !organizationData) return;

        const initialData = {
            defaultProjectUuid: organizationData.defaultProjectUuid,
        };

        form.setInitialValues(initialData);
        form.setValues(initialData);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOrganizationLoading, organizationData]);

    const handleOnSubmit = form.onSubmit(({ defaultProjectUuid }) => {
        if (!form.isValid) return;
        updateOrganization({ defaultProjectUuid: defaultProjectUuid });
    });

    return (
        <form onSubmit={handleOnSubmit}>
            <Stack>
                <Select
                    key={form.values.defaultProjectUuid}
                    label={t(
                        'components_user_settings_default_project_panel.form.project_name.label',
                    )}
                    data={projects
                        .filter(({ type }) => type !== ProjectType.PREVIEW)
                        .map((project) => ({
                            value: project.projectUuid,
                            label: project.name,
                        }))}
                    disabled={isLoading}
                    required
                    placeholder={t(
                        'components_user_settings_default_project_panel.form.project_name.placeholder',
                    )}
                    dropdownPosition="bottom"
                    {...form.getInputProps('defaultProjectUuid')}
                />

                <Flex justify="flex-end" gap="sm">
                    {form.isDirty() && !isOrganizationUpdateLoading && (
                        <Button variant="outline" onClick={() => form.reset()}>
                            {t(
                                'components_user_settings_default_project_panel.cancel',
                            )}
                        </Button>
                    )}
                    <Button
                        display="block"
                        type="submit"
                        disabled={isLoading || !form.isDirty()}
                        loading={isLoading}
                    >
                        {t(
                            'components_user_settings_default_project_panel.update',
                        )}
                    </Button>
                </Flex>
            </Stack>
        </form>
    );
};

export default DefaultProjectPanel;
