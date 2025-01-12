import { subject } from '@casl/ability';
import { FeatureFlags, type UserAttribute } from '@lightdash/common';
import {
    ActionIcon,
    Box,
    Button,
    Group,
    Modal,
    Stack,
    Table,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconAlertCircle,
    IconEdit,
    IconInfoCircle,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrganization } from '../../../hooks/organization/useOrganization';
import { useTableStyles } from '../../../hooks/styles/useTableStyles';
import { useFeatureFlag } from '../../../hooks/useFeatureFlagEnabled';
import {
    useUserAttributes,
    useUserAttributesDeleteMutation,
} from '../../../hooks/useUserAttributes';
import useApp from '../../../providers/App/useApp';
import LoadingState from '../../common/LoadingState';
import MantineIcon from '../../common/MantineIcon';
import { SettingsCard } from '../../common/Settings/SettingsCard';
import ForbiddenPanel from '../../ForbiddenPanel';
import UserAttributeModal from './UserAttributeModal';

const UserListItem: FC<{
    orgUserAttribute: UserAttribute;
    onEdit: () => void;
    isGroupManagementEnabled?: boolean;
}> = ({ orgUserAttribute, onEdit, isGroupManagementEnabled }) => {
    const [isDeleteDialogOpen, deleteDialog] = useDisclosure(false);
    const { mutate: deleteUserAttribute } = useUserAttributesDeleteMutation();
    const { t } = useTranslation();

    return (
        <tr>
            <td>
                <Stack spacing="xs">
                    <Group spacing="two">
                        <Text>{orgUserAttribute.name}</Text>
                        {orgUserAttribute.description && (
                            <Tooltip
                                multiline
                                maw={300}
                                withArrow
                                label={orgUserAttribute.description}
                            >
                                <MantineIcon
                                    icon={IconInfoCircle}
                                    color="gray.6"
                                />
                            </Tooltip>
                        )}
                    </Group>
                    <Group spacing="sm">
                        <Text fz="xs" color="gray.6">
                            {orgUserAttribute.users.length}{' '}
                            {t(
                                'components_user_settings_attributes_panel.user',
                            )}
                            {orgUserAttribute.users.length !== 1 ? 's' : ''}
                        </Text>
                        {isGroupManagementEnabled && (
                            <Text fz="xs" color="gray.6">
                                {orgUserAttribute.groups.length}{' '}
                                {t(
                                    'components_user_settings_attributes_panel.group',
                                )}
                                {orgUserAttribute.groups.length !== 1
                                    ? 's'
                                    : ''}
                            </Text>
                        )}
                    </Group>
                </Stack>
            </td>
            <td width="1%">
                <Group noWrap spacing="xs">
                    <ActionIcon
                        color="blue.4"
                        variant="outline"
                        onClick={onEdit}
                    >
                        <MantineIcon icon={IconEdit} />
                    </ActionIcon>

                    <ActionIcon
                        variant="outline"
                        onClick={deleteDialog.open}
                        color="red"
                    >
                        <MantineIcon icon={IconTrash} />
                    </ActionIcon>

                    <Modal
                        opened={isDeleteDialogOpen}
                        onClose={deleteDialog.close}
                        title={
                            <Group spacing="xs">
                                <MantineIcon
                                    size="lg"
                                    icon={IconAlertCircle}
                                    color="red"
                                />
                                <Title order={4}>
                                    {t(
                                        'components_user_settings_attributes_panel.modal_delete.delete',
                                    )}
                                </Title>
                            </Group>
                        }
                    >
                        <Text pb="md">
                            {t(
                                'components_user_settings_attributes_panel.modal_delete.content',
                            )}
                        </Text>
                        <Group spacing="xs" position="right">
                            <Button
                                onClick={deleteDialog.close}
                                variant="outline"
                                color="dark"
                            >
                                {t(
                                    'components_user_settings_attributes_panel.modal_delete.cancel',
                                )}
                            </Button>
                            <Button
                                onClick={() => {
                                    deleteUserAttribute(orgUserAttribute.uuid);
                                }}
                                color="red"
                            >
                                {t(
                                    'components_user_settings_attributes_panel.modal_delete.delete',
                                )}
                            </Button>
                        </Group>
                    </Modal>
                </Group>
            </td>
        </tr>
    );
};

const UserAttributesPanel: FC = () => {
    const { classes } = useTableStyles();
    const { user } = useApp();
    const { data: UserGroupsFeatureFlag } = useFeatureFlag(
        FeatureFlags.UserGroupsEnabled,
    );
    const [showAddAttributeModal, addAttributeModal] = useDisclosure(false);
    const { t } = useTranslation();

    const [editAttribute, setEditAttribute] = useState<
        UserAttribute | undefined
    >();

    const { data: orgUserAttributes, isInitialLoading } = useUserAttributes();
    const { data: organization } = useOrganization();
    if (
        user.data?.ability.cannot(
            'manage',
            subject('Organization', {
                organizationUuid: organization?.organizationUuid,
            }),
        )
    ) {
        return <ForbiddenPanel />;
    }

    if (isInitialLoading)
        return (
            <LoadingState
                title={t('components_user_settings_attributes_panel.loading')}
            />
        );

    if (!user.data || !UserGroupsFeatureFlag) return null;

    const isGroupManagementEnabled = UserGroupsFeatureFlag?.enabled;

    return (
        <Stack>
            <Group position="apart">
                <Group spacing="two">
                    <Title order={5}>
                        {isGroupManagementEnabled
                            ? t(
                                  'components_user_settings_attributes_panel.user_and_group_attributes',
                              )
                            : t(
                                  'components_user_settings_attributes_panel.user_attributes',
                              )}
                    </Title>
                    <Tooltip
                        multiline
                        w={400}
                        withArrow
                        label={
                            <Box>
                                {t(
                                    'components_user_settings_attributes_panel.tooltip.label',
                                )}
                            </Box>
                        }
                    >
                        <ActionIcon
                            component="a"
                            href="https://docs.lightdash.com/references/user-attributes"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <MantineIcon icon={IconInfoCircle} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
                <>
                    <Button
                        size="xs"
                        leftIcon={<MantineIcon icon={IconPlus} />}
                        onClick={addAttributeModal.open}
                    >
                        {t(
                            'components_user_settings_attributes_panel.add_new_attribute',
                        )}
                    </Button>
                    <UserAttributeModal
                        opened={showAddAttributeModal}
                        onClose={addAttributeModal.close}
                        allUserAttributes={orgUserAttributes || []}
                    />
                </>
            </Group>

            {isInitialLoading ? (
                <LoadingState
                    title={t(
                        'components_user_settings_attributes_panel.loading',
                    )}
                />
            ) : orgUserAttributes?.length === 0 ? (
                <SettingsCard shadow="none">
                    {t(
                        'components_user_settings_attributes_panel.no_attributes',
                    )}
                </SettingsCard>
            ) : (
                <SettingsCard shadow="none" p={0}>
                    <Table className={classes.root}>
                        <thead>
                            <tr>
                                <th>
                                    {t(
                                        'components_user_settings_attributes_panel.table.attribute_name',
                                    )}
                                </th>

                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgUserAttributes?.map((orgUserAttribute) => (
                                <UserListItem
                                    key={orgUserAttribute.uuid}
                                    orgUserAttribute={orgUserAttribute}
                                    onEdit={() =>
                                        setEditAttribute(orgUserAttribute)
                                    }
                                    isGroupManagementEnabled={
                                        isGroupManagementEnabled
                                    }
                                />
                            ))}
                        </tbody>
                    </Table>
                </SettingsCard>
            )}

            {editAttribute !== undefined && (
                <UserAttributeModal
                    opened={true}
                    userAttribute={editAttribute}
                    onClose={() => setEditAttribute(undefined)}
                    allUserAttributes={orgUserAttributes || []}
                />
            )}
        </Stack>
    );
};

export default UserAttributesPanel;
