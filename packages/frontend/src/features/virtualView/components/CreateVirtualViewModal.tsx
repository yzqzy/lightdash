import { DbtProjectType, snakeCaseName } from '@lightdash/common';
import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    Tooltip,
    type ModalProps,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconInfoCircle, IconTableAlias } from '@tabler/icons-react';
import { useCallback, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import MantineIcon from '../../../components/common/MantineIcon';
import { useGitIntegration } from '../../../hooks/gitIntegration/useGitIntegration';
import useHealth from '../../../hooks/health/useHealth';
import { useProject } from '../../../hooks/useProject';
import { useAppSelector } from '../../sqlRunner/store/hooks';
import { useCreateVirtualView } from '../hooks/useVirtualView';

const validationSchema = z.object({
    name: z.string().min(1),
});

type FormValues = z.infer<typeof validationSchema>;

type Props = ModalProps;

export const CreateVirtualViewModal: FC<Props> = ({ opened, onClose }) => {
    const { t } = useTranslation();

    const health = useHealth();
    const projectUuid = useAppSelector((state) => state.sqlRunner.projectUuid);
    const sql = useAppSelector((state) => state.sqlRunner.sql);
    const columns = useAppSelector((state) => state.sqlRunner.sqlColumns);

    const name = useAppSelector((state) => state.sqlRunner.name);

    const {
        mutateAsync: createVirtualView,
        isLoading: isLoadingVirtual,
        error,
    } = useCreateVirtualView({
        projectUuid,
    });
    const form = useForm<FormValues>({
        initialValues: {
            name: name || '',
        },
        validate: zodResolver(validationSchema),
    });

    const { data: project } = useProject(projectUuid);
    const { data: gitIntegration, isError } = useGitIntegration(projectUuid);

    const canWriteToDbtProject = !!(
        health.data?.hasGithub &&
        gitIntegration?.enabled === true &&
        !isError &&
        project?.dbtConnection.type === DbtProjectType.GITHUB
    );

    const handleSubmit = useCallback(
        async (data: { name: string }) => {
            if (!columns) {
                return;
            }

            await createVirtualView({
                name: snakeCaseName(data.name),
                sql,
                columns,
                projectUuid,
            });

            onClose();
        },
        [columns, onClose, projectUuid, sql, createVirtualView],
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            keepMounted={false}
            title={
                <Group spacing="xs">
                    <MantineIcon
                        icon={IconTableAlias}
                        size="lg"
                        color="gray.7"
                    />
                    <Text fw={500}>
                        {t('components_virtual_view.create.title')}
                    </Text>
                    <Tooltip
                        variant="xs"
                        withinPortal
                        multiline
                        maw={300}
                        label={`${t(
                            'components_virtual_view.create.content.part_1',
                        )} ${
                            canWriteToDbtProject
                                ? t(
                                      'components_virtual_view.create.content.part_2',
                                  )
                                : ''
                        } `}
                    >
                        <MantineIcon
                            color="gray.7"
                            icon={IconInfoCircle}
                            size={16}
                        />
                    </Tooltip>
                </Group>
            }
            styles={(theme) => ({
                header: { borderBottom: `1px solid ${theme.colors.gray[4]}` },
                body: { padding: 0 },
            })}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack p="md">
                    <TextInput
                        radius="md"
                        label="Name"
                        required
                        {...form.getInputProps('name')}
                        error={!!error?.error}
                    />
                </Stack>

                <Group position="right" w="100%" p="md">
                    <Button
                        color="gray.7"
                        onClick={onClose}
                        variant="outline"
                        disabled={isLoadingVirtual}
                        size="xs"
                    >
                        {t('components_virtual_view.create.cancel')}
                    </Button>

                    <Button
                        type="submit"
                        disabled={!form.values.name || !sql}
                        loading={isLoadingVirtual}
                        size="xs"
                    >
                        {t('components_virtual_view.create.create')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};
