import {
    ResourceViewItemType,
    wrapResourceView,
    type ResourceViewItem,
} from '@lightdash/common';
import { ActionIcon, Group, Stack, TextInput } from '@mantine/core';
import { IconChartBar, IconSearch, IconX } from '@tabler/icons-react';
import Fuse from 'fuse.js';
import { useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import LoadingState from '../components/common/LoadingState';
import MantineIcon from '../components/common/MantineIcon';
import PageBreadcrumbs from '../components/common/PageBreadcrumbs';
import ResourceView from '../components/common/ResourceView';
import { SortDirection } from '../components/common/ResourceView/ResourceViewList';
import { useCharts } from '../hooks/useCharts';
import { useApp } from '../providers/AppProvider';

const MobileCharts: FC = () => {
    const { t } = useTranslation();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { isInitialLoading, data: savedQueries = [] } =
        useCharts(projectUuid);
    const { user } = useApp();
    const cannotView = user.data?.ability?.cannot('view', 'SavedChart');
    const [search, setSearch] = useState<string>('');
    const visibleItems = useMemo(() => {
        const items = wrapResourceView(
            savedQueries,
            ResourceViewItemType.CHART,
        );
        if (search && search !== '') {
            const matchingItems: ResourceViewItem[] = [];
            new Fuse(items, {
                keys: ['data.name'],
                ignoreLocation: true,
                threshold: 0.3,
            })
                .search(search)
                .forEach((res) => matchingItems.push(res.item));
            return matchingItems;
        }
        return items;
    }, [savedQueries, search]);

    if (isInitialLoading && !cannotView) {
        return <LoadingState title={t('pages_mobile_charts.loading_charts')} />;
    }

    return (
        <Stack spacing="md" m="lg">
            <Group position="apart">
                <PageBreadcrumbs
                    items={[
                        {
                            title: t('pages_mobile_charts.bread_crumbs.home'),
                            to: '/home',
                        },
                        {
                            title: t(
                                'pages_mobile_charts.bread_crumbs.all_saved_charts',
                            ),
                            active: true,
                        },
                    ]}
                />
            </Group>
            <TextInput
                icon={<MantineIcon icon={IconSearch} />}
                rightSection={
                    search ? (
                        <ActionIcon onClick={() => setSearch('')}>
                            <MantineIcon icon={IconX} />
                        </ActionIcon>
                    ) : null
                }
                placeholder={t('pages_mobile_charts.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <ResourceView
                items={visibleItems}
                listProps={{
                    defaultSort: { updatedAt: SortDirection.DESC },
                    defaultColumnVisibility: {
                        space: false,
                        updatedAt: false,
                        actions: false,
                    },
                }}
                emptyStateProps={{
                    icon: <IconChartBar size={30} />,
                    title: t('pages_mobile_charts.no_charts_added_yet'),
                }}
            />
        </Stack>
    );
};

export default MobileCharts;
