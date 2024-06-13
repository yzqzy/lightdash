import { LightdashMode } from '@lightdash/common';
import { Button, Menu } from '@mantine/core';
import {
    IconBook,
    IconHelp,
    IconMessageCircle2,
    IconMessages,
    IconUsers,
} from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useIntercom } from 'react-use-intercom';
import useHealth from '../../hooks/health/useHealth';
import LargeMenuItem from '../common/LargeMenuItem';
import MantineIcon from '../common/MantineIcon';

const HelpMenu: FC = () => {
    const health = useHealth();
    const isCloudCustomer = health.data?.mode === LightdashMode.CLOUD_BETA;

    const { show: showIntercom } = useIntercom();
    const { t } = useTranslation();

    return (
        <Menu
            withArrow
            shadow="lg"
            position="bottom-end"
            arrowOffset={16}
            offset={-2}
        >
            <Menu.Target>
                <Button aria-label="Help" variant="default" size="xs">
                    <MantineIcon icon={IconHelp} />
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                {isCloudCustomer && (
                    <LargeMenuItem
                        onClick={() => {
                            // @ts-ignore
                            if (window.Pylon) {
                                // @ts-ignore
                                window.Pylon('show');
                            } else {
                                showIntercom();
                            }
                        }}
                        title={t(
                            'components_navbar_help_menu.menus.contact_support.title',
                        )}
                        description={t(
                            'components_navbar_help_menu.menus.contact_support.description',
                        )}
                        icon={IconMessages}
                    />
                )}

                <LargeMenuItem
                    component="a"
                    href="https://docs.lightdash.com/"
                    target="_blank"
                    title={t(
                        'components_navbar_help_menu.menus.view_docs.title',
                    )}
                    description={t(
                        'components_navbar_help_menu.menus.view_docs.description',
                    )}
                    icon={IconBook}
                />

                <LargeMenuItem
                    component="a"
                    href="https://join.slack.com/t/lightdash-community/shared_invite/zt-2ehqnrvqt-LbCq7cUSFHAzEj_wMuxg4A"
                    target="_blank"
                    title={t('components_navbar_help_menu.menus.join.title')}
                    description={t(
                        'components_navbar_help_menu.menus.join.description',
                    )}
                    icon={IconUsers}
                />

                <LargeMenuItem
                    component="a"
                    href="https://github.com/lightdash/lightdash/issues/new/choose"
                    target="_blank"
                    title={t(
                        'components_navbar_help_menu.menus.feedback.title',
                    )}
                    description={t(
                        'components_navbar_help_menu.menus.feedback.description',
                    )}
                    icon={IconMessageCircle2}
                />
            </Menu.Dropdown>
        </Menu>
    );
};

export default HelpMenu;
