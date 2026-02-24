import { Button } from '@/vdb/components/ui/button.js';
import {
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/vdb/components/ui/dialog.js';
import { Trans } from '@lingui/react/macro';
import { Column } from '@tanstack/react-table';
import React, { useEffect, useState } from 'react';
import { DataTableBooleanFilter } from './filters/data-table-boolean-filter.js';
import { DataTableDateTimeFilter } from './filters/data-table-datetime-filter.js';
import { DataTableIdFilter } from './filters/data-table-id-filter.js';
import { DataTableNumberFilter } from './filters/data-table-number-filter.js';
import { DataTableStringFilter } from './filters/data-table-string-filter.js';
import { ColumnDataType } from './types.js';

export type CustomFilterComponent = React.ComponentType<{
    value: Record<string, any> | undefined;
    onChange: (filter: Record<string, any>) => void;
}>;

export interface DataTableFilterDialogProps {
    column: Column<any>;
    onEnter?: () => void;
}

export function DataTableFilterDialog({ column, onEnter }: Readonly<DataTableFilterDialogProps>) {
    const columnFilter = column.getFilterValue() as Record<string, string> | undefined;
    const [filter, setFilter] = useState(columnFilter);

    useEffect(() => {
        setFilter(columnFilter);
    }, [columnFilter]);

    const meta = column.columnDef.meta as any;
    const columnDataType = meta?.fieldInfo?.type as ColumnDataType;
    const CustomFilter = meta?.customFilterComponent as CustomFilterComponent | undefined;
    const filterLabel = meta?.filterLabel ?? column.id;
    const columnId = column.id;
    const isEmpty = !filter || Object.keys(filter).length === 0;
    const setFilterOnColumn = () => {
        column.setFilterValue(filter);
        setFilter(undefined);
    };
    const handleEnter = (e: React.KeyboardEvent<any>) => {
        if (e.key === 'Enter') {
            if (!isEmpty) {
                setFilterOnColumn();
                onEnter?.();
            }
        }
    };

    const renderFilter = () => {
        if (CustomFilter) {
            return <CustomFilter value={filter} onChange={e => setFilter(e)} />;
        }
        switch (columnDataType) {
            case 'String':
                return <DataTableStringFilter value={filter} onChange={e => setFilter(e)} />;
            case 'Int':
            case 'Float':
                return <DataTableNumberFilter value={filter} onChange={e => setFilter(e)} mode="number" />;
            case 'DateTime':
                return <DataTableDateTimeFilter value={filter} onChange={e => setFilter(e)} />;
            case 'Boolean':
                return <DataTableBooleanFilter value={filter} onChange={e => setFilter(e)} />;
            case 'ID':
                return <DataTableIdFilter value={filter} onChange={e => setFilter(e)} />;
            case 'Money':
                return <DataTableNumberFilter value={filter} onChange={e => setFilter(e)} mode="money" />;
            default:
                return null;
        }
    };

    return (
        <DialogContent onKeyDown={handleEnter}>
            <DialogHeader>
                <DialogTitle>
                    <Trans>Filter by {filterLabel}</Trans>
                </DialogTitle>
            </DialogHeader>
            {renderFilter()}
            <DialogFooter className="sm:justify-end">
                {columnFilter && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => column.setFilterValue(undefined)}
                    >
                        <Trans>Clear filter</Trans>
                    </Button>
                )}
                <DialogClose asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isEmpty}
                        onClick={() => {
                            setFilterOnColumn();
                        }}
                    >
                        <Trans>Apply filter</Trans>
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}
