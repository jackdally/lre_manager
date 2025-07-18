import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside the visible area
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    data: T;
    offsetTop: number;
    height: number;
  }>;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  setScrollTop: (scrollTop: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToItem: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

export const useVirtualScroll = <T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollResult<T> => {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate virtual scroll parameters
  const virtualScrollParams = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      totalHeight,
      startIndex,
      endIndex,
    };
  }, [items.length, itemHeight, scrollTop, containerHeight, overscan]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = virtualScrollParams;
    const itemsToRender: Array<{
      index: number;
      data: T;
      offsetTop: number;
      height: number;
    }> = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < items.length) {
        itemsToRender.push({
          index: i,
          data: items[i],
          offsetTop: i * itemHeight,
          height: itemHeight,
        });
      }
    }

    return itemsToRender;
  }, [items, virtualScrollParams, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop: newScrollTop } = event.currentTarget;
    setScrollTop(newScrollTop);
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    const newScrollTop = index * itemHeight;
    setScrollTop(newScrollTop);
    if (containerRef.current) {
      containerRef.current.scrollTop = newScrollTop;
    }
  }, [itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    setScrollTop(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const newScrollTop = (items.length - 1) * itemHeight;
    setScrollTop(newScrollTop);
    if (containerRef.current) {
      containerRef.current.scrollTop = newScrollTop;
    }
  }, [items.length, itemHeight]);

  // Sync scroll position with container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  return {
    virtualItems,
    totalHeight: virtualScrollParams.totalHeight,
    startIndex: virtualScrollParams.startIndex,
    endIndex: virtualScrollParams.endIndex,
    scrollTop,
    setScrollTop,
    containerRef,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    handleScroll,
  };
}; 