import {
    getMetricsTreeNodeId,
    MAX_METRICS_TREE_NODE_COUNT,
    type CatalogField,
    type CatalogMetricsTreeEdge,
} from '@lightdash/common';
import { Box } from '@mantine/core';
import {
    addEdge,
    Background,
    ReactFlow,
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
    type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, type FC } from 'react';
import SuboptimalState from '../../../../components/common/SuboptimalState/SuboptimalState';
import { useAppSelector } from '../../../sqlRunner/store/hooks';
import {
    useCreateMetricsTreeEdge,
    useDeleteMetricsTreeEdge,
    useMetricsTree,
} from '../../hooks/useMetricsTree';

type Props = {
    metrics: CatalogField[];
};

function getEdgeId(edge: Pick<CatalogMetricsTreeEdge, 'source' | 'target'>) {
    const sourceId = getMetricsTreeNodeId(edge.source);
    const targetId = getMetricsTreeNodeId(edge.target);
    return `${sourceId}_${targetId}`;
}

const MetricTree: FC<Props> = ({ metrics }) => {
    const projectUuid = useAppSelector(
        (state) => state.metricsCatalog.projectUuid,
    );

    const selectedMetricIds = useMemo(() => {
        return metrics.map((metric) => getMetricsTreeNodeId(metric));
    }, [metrics]);

    const isValidMetricsTree =
        metrics.length > 0 && metrics.length <= MAX_METRICS_TREE_NODE_COUNT;

    const { data: metricsTree } = useMetricsTree(
        projectUuid,
        selectedMetricIds,
        {
            enabled: !!projectUuid && isValidMetricsTree,
        },
    );

    const { mutateAsync: createMetricsTreeEdge } = useCreateMetricsTreeEdge();
    const { mutateAsync: deleteMetricsTreeEdge } = useDeleteMetricsTreeEdge();

    const initialNodes = useMemo<Node[]>(() => {
        return metrics.map((metric) => ({
            id: getMetricsTreeNodeId(metric),
            position: { x: 0, y: 0 },
            data: { label: metric.name },
        }));
    }, [metrics]);

    const initialEdges = useMemo<Edge[]>(() => {
        // If there are saved edges, use them
        // Only use edges where both source and target are in the metrics array
        if (metricsTree) {
            const edges = metricsTree.edges.filter(
                (edge) =>
                    metrics.some(
                        (metric) =>
                            getMetricsTreeNodeId(metric) ===
                            getMetricsTreeNodeId(edge.source),
                    ) &&
                    metrics.some(
                        (metric) =>
                            getMetricsTreeNodeId(metric) ===
                            getMetricsTreeNodeId(edge.target),
                    ),
            );

            return edges.map((edge) => ({
                id: getEdgeId(edge),
                source: getMetricsTreeNodeId(edge.source),
                target: getMetricsTreeNodeId(edge.target),
            }));
        }

        return [];
    }, [metrics, metricsTree]);

    const [currentNodes, setCurrentNodes, onNodesChange] =
        useNodesState(initialNodes);

    const [currentEdges, setCurrentEdges, onEdgesChange] =
        useEdgesState(initialEdges);

    // Set the current edges to the initial edges in the case that the request for metrics tree is slow
    useEffect(() => {
        setCurrentEdges(initialEdges);
    }, [initialEdges, setCurrentEdges]);

    // Set the current nodes to the initial nodes in case the filters change
    useEffect(() => {
        setCurrentNodes(initialNodes);
    }, [initialNodes, setCurrentNodes]);

    const handleNodeChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            const preventedChangeTypes: NodeChange<Node>['type'][] = [
                'replace',
                'remove',
            ];
            const changesToApply = changes.filter(
                (c) => !preventedChangeTypes.includes(c.type),
            );
            onNodesChange(changesToApply);
        },
        [onNodesChange],
    );

    const handleConnect = useCallback(
        async (params: Connection) => {
            if (projectUuid) {
                await createMetricsTreeEdge({
                    projectUuid,
                    sourceMetricId: params.source,
                    targetMetricId: params.target,
                });

                setCurrentEdges((els) => addEdge(params, els));
            }
        },
        [setCurrentEdges, createMetricsTreeEdge, projectUuid],
    );

    const handleEdgesDelete = useCallback(
        async (edges: Edge[]) => {
            if (projectUuid) {
                const promises = edges.map((edge) => {
                    return deleteMetricsTreeEdge({
                        projectUuid,
                        sourceMetricId: edge.source,
                        targetMetricId: edge.target,
                    });
                });

                await Promise.all(promises);
            }
        },
        [deleteMetricsTreeEdge, projectUuid],
    );

    return (
        <Box h="100%">
            {isValidMetricsTree ? (
                <ReactFlow
                    nodes={currentNodes}
                    edges={currentEdges}
                    fitView
                    attributionPosition="top-right"
                    onNodesChange={handleNodeChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    edgesReconnectable={false}
                    onEdgesDelete={handleEdgesDelete}
                >
                    <Background />
                </ReactFlow>
            ) : (
                <SuboptimalState
                    title="Metrics tree not available"
                    description="Please narrow your search to display up to 30 metrics"
                />
            )}
        </Box>
    );
};

export default MetricTree;