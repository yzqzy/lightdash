import {
    FilterOperator,
    friendlyName,
    type FilterDashboardToRule,
} from '@lightdash/common';
import { Menu, Text } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon from '../common/MantineIcon';

type Props = {
    filters: FilterDashboardToRule[];
    onAddFilter: (filter: FilterDashboardToRule, isTemporary: boolean) => void;
};

export const FilterDashboardTo: FC<Props> = ({ filters, onAddFilter }) => {
    const { t, i18n } = useTranslation();
    const isZh = i18n.language && i18n.language.includes('zh');

    return (
        <>
            <Menu.Divider />
            <Menu.Label>
                {t('components_dashboard_filter.filter_dashboard.title')}
            </Menu.Label>

            {filters.map((filter) => (
                <Menu.Item
                    key={filter.id}
                    icon={<MantineIcon icon={IconFilter} />}
                    onClick={() => onAddFilter(filter, true)}
                >
                    {isZh
                        ? filter.target.tableLabel
                        : friendlyName(filter.target.tableName)}
                    -{' '}
                    {isZh
                        ? filter.target.fieldLabel
                        : friendlyName(filter.target.fieldName)}{' '}
                    is{' '}
                    {filter.operator === FilterOperator.NULL && (
                        <Text span fw={500}>
                            {t(
                                'components_dashboard_filter.filter_dashboard.null',
                            )}
                        </Text>
                    )}
                    {filter.values && filter.values[0] && (
                        <Text span fw={500}>
                            {String(filter.values[0])}
                        </Text>
                    )}
                </Menu.Item>
            ))}
        </>
    );
};
