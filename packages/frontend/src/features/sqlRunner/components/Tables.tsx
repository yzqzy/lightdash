import {
    ActionIcon,
    Box,
    Center,
    CopyButton,
    Highlight,
    Loader,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Tooltip,
    UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useHover } from '@mantine/hooks';
import { IconCopy, IconSearch, IconX } from '@tabler/icons-react';
import { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon from '../../../components/common/MantineIcon';
import { useIsTruncated } from '../../../hooks/useIsTruncated';
import { useTables } from '../hooks/useTables';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleActiveTable } from '../store/sqlRunnerSlice';

const TableItem: FC<{
    table: string;
    search: string;
    schema: string;
    database: string;
    isActive: boolean;
}> = memo(({ table, search, schema, database, isActive }) => {
    const { ref: hoverRef, hovered } = useHover();
    const { ref: truncatedRef, isTruncated } = useIsTruncated<HTMLDivElement>();
    const dispatch = useAppDispatch();

    return (
        <Box ref={hoverRef} pos="relative">
            <UnstyledButton
                onClick={() => {
                    dispatch(toggleActiveTable(table));
                }}
                w="100%"
                p={4}
                sx={(theme) => ({
                    fontWeight: 500,
                    fontSize: 13,
                    borderRadius: theme.radius.sm,
                    color: isActive ? 'gray.8' : 'gray.7',
                    backgroundColor: isActive ? 'gray.1' : 'transparent',
                    flex: 1,
                    '&:hover': {
                        backgroundColor: theme.colors.gray[1],
                    },
                })}
            >
                <Tooltip
                    withinPortal
                    variant="xs"
                    label={table}
                    disabled={!isTruncated}
                    multiline
                    maw={300}
                    sx={{
                        wordBreak: 'break-word',
                    }}
                >
                    <Highlight
                        ref={truncatedRef}
                        component={Text}
                        highlight={search || ''}
                        truncate
                        sx={{
                            flex: 1,
                        }}
                    >
                        {table}
                    </Highlight>
                </Tooltip>
            </UnstyledButton>

            <Box
                pos="absolute"
                top={4}
                right={8}
                display={hovered ? 'block' : 'none'}
            >
                <CopyButton value={`${database}.${schema}.${table}`}>
                    {({ copied, copy }) => (
                        <ActionIcon size={16} onClick={copy} bg="gray.1">
                            <MantineIcon
                                icon={IconCopy}
                                color={copied ? 'green' : 'blue'}
                                onClick={copy}
                            />
                        </ActionIcon>
                    )}
                </CopyButton>
            </Box>
        </Box>
    );
});

export const Tables: FC = () => {
    const { t } = useTranslation();

    const projectUuid = useAppSelector((state) => state.sqlRunner.projectUuid);
    const activeTable = useAppSelector((state) => state.sqlRunner.activeTable);

    const [search, setSearch] = useState<string>('');
    const [debouncedSearch] = useDebouncedValue(search, 300);
    const isValidSearch = Boolean(
        debouncedSearch && debouncedSearch.trim().length > 2,
    );

    const { data, isLoading, isSuccess } = useTables({
        projectUuid,
        search: isValidSearch ? debouncedSearch : undefined,
    });

    return (
        <>
            <TextInput
                size="xs"
                disabled={!data && !isValidSearch}
                icon={
                    isLoading ? (
                        <Loader size="xs" />
                    ) : (
                        <MantineIcon icon={IconSearch} />
                    )
                }
                rightSection={
                    search ? (
                        <ActionIcon size="xs" onClick={() => setSearch('')}>
                            <MantineIcon icon={IconX} />
                        </ActionIcon>
                    ) : null
                }
                placeholder={t('features_sql_runner_tables.search_tables')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                styles={(theme) => ({
                    input: {
                        borderRadius: theme.radius.md,
                        border: `1px solid ${theme.colors.gray[3]}`,
                    },
                })}
            />
            {isSuccess &&
                data &&
                data.tablesBySchema?.map(({ schema, tables }) => (
                    <ScrollArea
                        offsetScrollbars
                        variant="primary"
                        className="only-vertical"
                        sx={{ flex: 1 }}
                        type="auto"
                        key={schema}
                    >
                        <Stack spacing={0}>
                            <Text p={6} fw={700} fz="md" c="gray.7">
                                {schema}
                            </Text>
                            {Object.keys(tables).map((table) => (
                                <TableItem
                                    key={table}
                                    search={search}
                                    isActive={activeTable === table}
                                    table={table}
                                    schema={`${schema}`}
                                    database={data.database}
                                />
                            ))}
                        </Stack>
                    </ScrollArea>
                ))}
            {isSuccess && !data && (
                <Center p="sm">
                    <Text c="gray.4">
                        {t('features_sql_runner_tables.no_results_found')}
                    </Text>
                </Center>
            )}
        </>
    );
};
