import {
  autoUpdate,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { useState } from "react";

export default function Popover({
  children,
  popup,
  as,
}: React.PropsWithChildren<{ popup?: React.ReactNode; as: "span" | "div" }>) {
  const Tag = as;

  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "right",
    middleware: [offset({ mainAxis: 16 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <Tag
        ref={(el) => {
          refs.setReference(el);
        }}
        {...getReferenceProps()}
      >
        {children}
      </Tag>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={(el) => {
              refs.setFloating(el);
            }}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {popup}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
