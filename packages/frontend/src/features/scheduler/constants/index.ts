import { useTranslation } from 'react-i18next';

export const CUSTOM_WIDTH_OPTIONS = [
    {
        label: 'Tablet (1000px)',
        value: '1000',
    },
    {
        label: 'Laptop Screen (1400px)',
        value: '1400',
    },
    {
        label: 'External Monitor (1500px)',
        value: '1500',
    },
    {
        label: 'TV Screen (1600px)',
        value: '1600',
    },
];

export const useCustomWidthOptions = () => {
    const { t } = useTranslation();

    return [
        {
            label: t('features_scheduler_constants.tablet'),
            value: '1000',
        },
        {
            label: t('features_scheduler_constants.laptop_screen'),
            value: '1400',
        },
        {
            label: t('features_scheduler_constants.external_monitor'),
            value: '1500',
        },
        {
            label: t('features_scheduler_constants.tv_screen'),
            value: '1600',
        },
    ];
};
