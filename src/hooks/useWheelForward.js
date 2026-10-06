import { useEffect } from "react";
import { GRID } from "../grid";

const LINE_HEIGHT = 40;

// On desktop layouts where the page itself doesn't scroll, send wheel input
// anywhere in `sectionRef` to the scrolling panel in `panelRef`.
export function useWheelForward(sectionRef, panelRef) {
  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return undefined;

    const mq = window.matchMedia(GRID.MEDIA_TABLET);

    const onWheel = (e) => {
      if (mq.matches || e.ctrlKey) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? LINE_HEIGHT : e.deltaMode === 2 ? panel.clientHeight : 1;
      panel.scrollTop += e.deltaY * unit;
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, [sectionRef, panelRef]);
}

export default useWheelForward;
