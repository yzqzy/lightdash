import { Box, Button, Popover } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    COLLAPSABLE_CARD_BUTTON_PROPS,
    COLLAPSABLE_CARD_POPOVER_PROPS,
} from '../../common/CollapsableCard';
import MantineIcon from '../../common/MantineIcon';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';
import { ConfigTabs } from './TableConfigTabs';

const TableConfigPanel: React.FC = () => {
    const { t } = useTranslation();
    const { resultsData } = useVisualizationContext();
    const disabled = !resultsData;

    return (
        <Popover {...COLLAPSABLE_CARD_POPOVER_PROPS} disabled={disabled}>
            <Popover.Target>
                <Button
                    {...COLLAPSABLE_CARD_BUTTON_PROPS}
                    disabled={disabled}
                    rightIcon={
                        <MantineIcon icon={IconChevronDown} color="gray" />
                    }
                >
                    {t('components_visualization_configs_table.configure')}
                </Button>
            </Popover.Target>

            <Popover.Dropdown>
                <Box w={320}>
                    <ConfigTabs />
                </Box>
            </Popover.Dropdown>
        </Popover>
    );
};

export default TableConfigPanel;
