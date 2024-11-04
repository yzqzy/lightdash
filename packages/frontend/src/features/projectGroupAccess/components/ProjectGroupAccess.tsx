import {
    isGroupWithMembers,
    type CreateProjectGroupAccess,
    type GroupWithMembers,
} from '@lightdash/common';
import { Box, Paper, Table } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import SuboptimalState from '../../../components/common/SuboptimalState/SuboptimalState';
import { useTableStyles } from '../../../hooks/styles/useTableStyles';
import useToaster from '../../../hooks/toaster/useToaster';
import { useOrganizationGroups } from '../../../hooks/useOrganizationGroups';
import { TrackPage } from '../../../providers/TrackingProvider';
import { CategoryName, PageName, PageType } from '../../../types/Events';
import {
    useAddProjectGroupAccessMutation,
    useProjectGroupAccessList,
} from '../hooks/useProjectGroupAccess';
import AddProjectGroupAccessModal from './AddProjectGroupAccessModal';
import ProjectGroupAccessItem from './ProjectGroupAccessItem';

interface ProjectGroupAccessProps {
    projectUuid: string;
    isAddingProjectGroupAccess: boolean;
    onAddProjectGroupAccessClose: () => void;
}

const ProjectGroupAccess: FC<ProjectGroupAccessProps> = ({
    projectUuid,
    isAddingProjectGroupAccess,
    onAddProjectGroupAccessClose,
}) => {
    const { t } = useTranslation();
    const { cx, classes } = useTableStyles();

    const { showToastSuccess } = useToaster();

    const { data: groups, isInitialLoading: isLoadingGroups } =
        useOrganizationGroups({ includeMembers: 5 });

    const { mutateAsync: addProjectGroupAccess, isLoading: isSubmitting } =
        useAddProjectGroupAccessMutation();

    const handleAddProjectGroupAccess = async (
        formData: CreateProjectGroupAccess,
    ) => {
        await addProjectGroupAccess(formData);
        showToastSuccess({
            title: t('features_project_group_access.toast.success'),
        });
        onAddProjectGroupAccessClose();
    };

    const {
        data: projectGroupAccessList,
        isInitialLoading: isLoadingProjectGroupAccessList,
    } = useProjectGroupAccessList(projectUuid);

    const availableGroups = useMemo(() => {
        if (!groups || !projectGroupAccessList) return [];

        // TODO: Why does filter assume that it will always be Group???
        return groups
            .map((g) => {
                if (isGroupWithMembers(g)) {
                    return g;
                }
            })
            .filter((g): g is GroupWithMembers => {
                return Boolean(
                    g &&
                        isGroupWithMembers(g) &&
                        !projectGroupAccessList?.find((access) => {
                            return access.groupUuid === g.uuid;
                        }),
                );
            });
    }, [groups, projectGroupAccessList]);

    return (
        <TrackPage
            name={PageName.PROJECT_MANAGE_GROUP_ACCESS}
            type={PageType.PAGE}
            category={CategoryName.SETTINGS}
        >
            {isLoadingGroups || isLoadingProjectGroupAccessList ? (
                <Box mt="4xl">
                    <SuboptimalState loading />
                </Box>
            ) : projectGroupAccessList?.length === 0 ? (
                <Box mt="4xl">
                    <SuboptimalState
                        icon={IconUsersGroup}
                        title={t(
                            'features_project_group_access.no_group_found.title',
                        )}
                        description={t(
                            'features_project_group_access.no_group_found.description',
                        )}
                    />
                </Box>
            ) : (
                <Paper withBorder style={{ overflow: 'hidden' }}>
                    <Table
                        className={cx(classes.root, classes.alignLastTdRight)}
                    >
                        <thead>
                            <tr>
                                <th>
                                    {t(
                                        'features_project_group_access.table.group_name',
                                    )}
                                </th>
                                <th>
                                    {' '}
                                    {t(
                                        'features_project_group_access.table.group_role',
                                    )}
                                </th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectGroupAccessList?.map(
                                (projectGroupAccess) => {
                                    const group = groups?.find(
                                        (g) =>
                                            g.uuid ===
                                            projectGroupAccess.groupUuid,
                                    );

                                    return (
                                        group &&
                                        isGroupWithMembers(group) && (
                                            <ProjectGroupAccessItem
                                                key={
                                                    projectGroupAccess.groupUuid
                                                }
                                                access={projectGroupAccess}
                                                group={group}
                                            />
                                        )
                                    );
                                },
                            )}
                        </tbody>
                    </Table>
                </Paper>
            )}

            {availableGroups && isAddingProjectGroupAccess && (
                <AddProjectGroupAccessModal
                    projectUuid={projectUuid}
                    totalNumberOfGroups={groups?.length || 0}
                    availableGroups={availableGroups}
                    isSubmitting={isSubmitting}
                    onSubmit={handleAddProjectGroupAccess}
                    onClose={() => onAddProjectGroupAccessClose()}
                />
            )}
        </TrackPage>
    );
};

export default ProjectGroupAccess;
