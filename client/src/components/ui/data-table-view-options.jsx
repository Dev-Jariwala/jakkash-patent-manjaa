/* eslint-disable react/prop-types */
import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, } from "./dropdown-menu";
import { GripVertical, Settings2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export function DataTableViewOptions({ table, headers }) {
    const [columnsOrder, setColumnsOrder] = useState(
        table.getAllColumns().map((column) => column.id)
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = ({ active, over }) => {
        if (active.id !== over.id) {
            const oldIndex = columnsOrder.indexOf(active.id);
            const newIndex = columnsOrder.indexOf(over.id);
            const newOrder = arrayMove(columnsOrder, oldIndex, newIndex);

            setColumnsOrder(newOrder);
            table.setColumnOrder(newOrder);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="tw-ml-auto tw-h-8 lg:tw-flex tw-text-gray-600 hover:tw-text-gray-700"
                >
                    <Settings2 className="tw-mr-2 tw-h-4 tw-w-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel className="tw-text-gray-600" >Display properties</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columnsOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        {columnsOrder.map((columnId) => {
                            const column = table
                                .getAllColumns()
                                .find((col) => col.id === columnId);

                            return (
                                <SortableItem
                                    key={columnId}
                                    id={columnId}
                                    column={column}
                                    headers={headers}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
function SortableItem({ id, column, headers }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div className="tw-flex tw-items-center tw-justify-between tw-space-x-4" ref={setNodeRef}
            style={style}>
            <DropdownMenuCheckboxItem
                className="tw-capitalize tw-w-full"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
            >
                {headers ? headers[column.id] : column.id}
            </DropdownMenuCheckboxItem>
            <span

                {...attributes}
                {...listeners}
                className="tw-cursor-grab "
            >
                <GripVertical className="tw-mr-2 tw-h-4 tw-w-4 hover:tw-bg-gray-200 tw-rounded" />
            </span>
        </div>
    );
}