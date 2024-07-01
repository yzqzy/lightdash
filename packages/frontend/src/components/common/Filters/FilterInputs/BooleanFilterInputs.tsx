import {
    FilterOperator,
    isFilterRule,
    type ConditionalRule,
} from '@lightdash/common';
import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { type FilterInputsProps } from '.';
import { getPlaceholderByFilterTypeAndOperator } from '../utils/getPlaceholderByFilterTypeAndOperator';
import DefaultFilterInputs from './DefaultFilterInputs';

const BooleanFilterInputs = <T extends ConditionalRule>(
    props: FilterInputsProps<T>,
) => {
    const { t } = useTranslation();
    const { rule, onChange, disabled, filterType, popoverProps } = props;

    const isFilterRuleDisabled = isFilterRule(rule) && rule.disabled;

    const placeholder = getPlaceholderByFilterTypeAndOperator({
        type: filterType,
        operator: rule.operator,
        disabled: isFilterRuleDisabled,
    });

    switch (rule.operator) {
        case FilterOperator.EQUALS: {
            return (
                <Select
                    w="100%"
                    size="xs"
                    withinPortal={popoverProps?.withinPortal}
                    onDropdownOpen={popoverProps?.onOpen}
                    onDropdownClose={popoverProps?.onClose}
                    disabled={disabled}
                    placeholder={placeholder}
                    data={[
                        {
                            value: 'true',
                            label: t(
                                'components_common_filters_inputs.select.true',
                            ),
                        },
                        {
                            value: 'false',
                            label: t(
                                'components_common_filters_inputs.select.false',
                            ),
                        },
                    ]}
                    value={rule.values?.[0]?.toString() ?? null}
                    onChange={(value) =>
                        onChange({
                            ...rule,
                            values: value === null ? [] : [value === 'true'],
                        })
                    }
                />
            );
        }

        default: {
            return <DefaultFilterInputs {...props} />;
        }
    }
};

export default BooleanFilterInputs;
