export const ColumnResizer = ({
    header,
}) => {
    if (header?.column?.getCanResize() === false) return <></>;

    return (
        <div
            {...{
                onMouseDown: header?.getResizeHandler(),
                onTouchStart: header?.getResizeHandler(),
                className: `absolute top-0 right-0 cursor-col-resize w-px h-full bg-border hover:bg-muted-foreground hover:w-1.5`,
                style: {
                    userSelect: "none",
                    touchAction: "none",
                },
            }}
        />
    );
};