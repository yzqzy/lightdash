import { getFieldQuoteChar } from '@lightdash/common';
import { ActionIcon, Group, Paper, Stack, Tooltip } from '@mantine/core';
import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';

import MantineIcon from '../components/common/MantineIcon';
import Page from '../components/common/Page/Page';
import { Sidebar } from '../features/sqlRunner';
import { ContentPanel } from '../features/sqlRunner/components/ContentPanel';
import { Header } from '../features/sqlRunner/components/Header';
import { useSavedSqlChart } from '../features/sqlRunner/hooks/useSavedSqlCharts';
import { store } from '../features/sqlRunner/store';
import {
    useAppDispatch,
    useAppSelector,
} from '../features/sqlRunner/store/hooks';
import {
    resetState,
    setProjectUuid,
    setQuoteChar,
    setSavedChartData,
} from '../features/sqlRunner/store/sqlRunnerSlice';
import { useProject } from '../hooks/useProject';

const SqlRunnerNew = () => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();
    const projectUuid = useAppSelector(
        (state: any) => state.sqlRunner.projectUuid,
    );

    const params = useParams<{ projectUuid: string; slug?: string }>();

    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const { data: project } = useProject(projectUuid);

    useUnmount(() => {
        dispatch(resetState());
    });

    useEffect(() => {
        if (!projectUuid && params.projectUuid) {
            dispatch(setProjectUuid(params.projectUuid));
        }
    }, [dispatch, params.projectUuid, projectUuid]);

    const { data } = useSavedSqlChart({
        projectUuid,
        slug: params.slug,
    });

    useEffect(() => {
        if (data) {
            dispatch(setSavedChartData(data));
        }
    }, [dispatch, data]);

    useEffect(() => {
        if (project?.warehouseConnection?.type) {
            dispatch(
                setQuoteChar(
                    getFieldQuoteChar(project?.warehouseConnection?.type),
                ),
            );
        }
    }, [dispatch, project?.warehouseConnection?.type]);

    if (!projectUuid) {
        return null;
    }

    return (
        <Page
            title={t('pages_sql_runner_new.sql_runner')}
            noContentPadding
            flexContent
            header={<Header mode={params.slug ? 'edit' : 'create'} />}
            isSidebarOpen={isLeftSidebarOpen}
            sidebar={<Sidebar setSidebarOpen={setLeftSidebarOpen} />}
        >
            <Group
                align={'stretch'}
                grow
                spacing="none"
                p={0}
                style={{ flex: 1 }}
                w="100%"
            >
                {!isLeftSidebarOpen && (
                    <Paper
                        shadow="none"
                        radius={0}
                        px="sm"
                        py="lg"
                        style={{ flexGrow: 0 }}
                    >
                        <Stack spacing="xs">
                            <Tooltip
                                variant="xs"
                                label={t('pages_sql_runner_new.open_sidebar')}
                                position="right"
                            >
                                <ActionIcon size="sm">
                                    <MantineIcon
                                        icon={IconLayoutSidebarLeftExpand}
                                        onClick={() => setLeftSidebarOpen(true)}
                                    />
                                </ActionIcon>
                            </Tooltip>
                        </Stack>
                    </Paper>
                )}
                <ContentPanel />
            </Group>
        </Page>
    );
};

const SqlRunnerNewPage = () => {
    return (
        <Provider store={store}>
            <SqlRunnerNew />
        </Provider>
    );
};
export default SqlRunnerNewPage;
