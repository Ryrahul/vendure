import { Badge } from '@/vdb/components/ui/badge.js';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/vdb/components/ui/command.js';
import { api } from '@/vdb/graphql/api.js';
import { graphql } from '@/vdb/graphql/graphql.js';
import { cn } from '@/vdb/lib/utils.js';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

export interface DataTableFacetValueFilterProps {
    value: Record<string, any> | undefined;
    onChange: (filter: Record<string, any>) => void;
}

export const FACET_VALUES_FILTER_QUERY_KEY = ['facetValuesForFilter'];

const getFacetValuesForFilterDocument = graphql(`
    query GetFacetValuesForFilter($options: FacetValueListOptions) {
        facetValues(options: $options) {
            items {
                id
                name
                code
                facet {
                    id
                    name
                }
            }
            totalItems
        }
    }
`);

export function DataTableFacetValueFilter({
    value: incomingValue,
    onChange,
}: Readonly<DataTableFacetValueFilterProps>) {
    const { t } = useLingui();
    const initialIds: string[] = incomingValue?.in ?? [];
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds));

    const { data, isLoading } = useQuery({
        queryKey: FACET_VALUES_FILTER_QUERY_KEY,
        queryFn: () => api.query(getFacetValuesForFilterDocument, { options: { take: 500 } }),
        staleTime: 1000 * 60 * 5,
    });

    const facetValues = data?.facetValues?.items ?? [];

    useEffect(() => {
        const ids = Array.from(selectedIds);
        if (ids.length > 0) {
            onChange({ in: ids });
        } else {
            onChange({});
        }
    }, [selectedIds]);

    const toggleValue = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="flex flex-col gap-2">
            {selectedIds.size > 0 && (
                <div className="flex flex-wrap gap-1">
                    {facetValues
                        .filter(fv => selectedIds.has(fv.id))
                        .map(fv => (
                            <Badge key={fv.id} variant="secondary" className="rounded-sm px-1 font-normal">
                                {fv.facet.name}: {fv.name}
                            </Badge>
                        ))}
                </div>
            )}
            <Command className="border rounded-md">
                <CommandInput placeholder={t`Search facet values...`} />
                <CommandList className="max-h-[200px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <CommandEmpty>
                                <Trans>No facet values found.</Trans>
                            </CommandEmpty>
                            <CommandGroup>
                                {facetValues.map(fv => {
                                    const isSelected = selectedIds.has(fv.id);
                                    return (
                                        <CommandItem key={fv.id} onSelect={() => toggleValue(fv.id)}>
                                            <div
                                                className={cn(
                                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'opacity-50 [&_svg]:invisible',
                                                )}
                                            >
                                                <Check />
                                            </div>
                                            <span>
                                                {fv.facet.name}: {fv.name}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </Command>
        </div>
    );
}

/**
 * Returns a function that formats facet value IDs into human-readable labels
 * for display in filter badges. Uses the same React Query cache as the filter component.
 */
export function useFacetValueFilterBadgeFormatter(): (value: unknown) => React.ReactNode {
    const queryClient = useQueryClient();

    return useCallback(
        (value: unknown) => {
            if (!Array.isArray(value)) {
                return String(value);
            }

            const cachedData = queryClient.getQueryData<any>(FACET_VALUES_FILTER_QUERY_KEY);
            const items: Array<{ id: string; name: string; facet: { name: string } }> =
                cachedData?.facetValues?.items ?? [];

            const labels = value.map(id => {
                const fv = items.find(item => item.id === id);
                return fv ? `${fv.facet.name}: ${fv.name}` : id;
            });

            return labels.join(', ');
        },
        [queryClient],
    );
}
