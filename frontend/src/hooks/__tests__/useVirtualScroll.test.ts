import { renderHook, act } from '@testing-library/react';
import { useVirtualScroll } from '../useVirtualScroll';

describe('useVirtualScroll', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    expect(result.current.virtualItems).toBeDefined();
    expect(result.current.totalHeight).toBe(5000); // 100 items * 50px
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBeGreaterThan(0);
    expect(result.current.scrollTop).toBe(0);
    expect(typeof result.current.setScrollTop).toBe('function');
    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.scrollToItem).toBe('function');
    expect(typeof result.current.scrollToTop).toBe('function');
    expect(typeof result.current.scrollToBottom).toBe('function');
    expect(typeof result.current.handleScroll).toBe('function');
  });

  it('should calculate virtual items correctly', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300,
      overscan: 2
    }));

    // With 50px item height and 300px container, we should see ~6 items + overscan
    expect(result.current.virtualItems.length).toBeGreaterThan(6);
    expect(result.current.virtualItems.length).toBeLessThanOrEqual(10); // 6 + 2*2 overscan

    // Check first item
    expect(result.current.virtualItems[0].index).toBe(0);
    expect(result.current.virtualItems[0].data).toEqual({ id: 0, name: 'Item 0' });
    expect(result.current.virtualItems[0].offsetTop).toBe(0);
    expect(result.current.virtualItems[0].height).toBe(50);
  });

  it('should handle scroll position changes', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    const initialStartIndex = result.current.startIndex;
    const initialEndIndex = result.current.endIndex;

    act(() => {
      result.current.setScrollTop(200);
    });

    expect(result.current.scrollTop).toBe(200);
    // With 200px scroll and 50px item height, we should be at item 4 (200/50)
    // With overscan of 5, startIndex should be around 4-5 = -1, but clamped to 0
    expect(result.current.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.endIndex).toBeGreaterThan(initialEndIndex);
  });

  it('should scroll to specific item', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    act(() => {
      result.current.scrollToItem(10);
    });

    expect(result.current.scrollTop).toBe(500); // 10 * 50
    expect(result.current.startIndex).toBeGreaterThan(0);
  });

  it('should scroll to top', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    // First scroll down
    act(() => {
      result.current.setScrollTop(1000);
    });

    expect(result.current.scrollTop).toBe(1000);

    // Then scroll to top
    act(() => {
      result.current.scrollToTop();
    });

    expect(result.current.scrollTop).toBe(0);
    expect(result.current.startIndex).toBe(0);
  });

  it('should scroll to bottom', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    act(() => {
      result.current.scrollToBottom();
    });

    const expectedScrollTop = (mockItems.length - 1) * 50; // 99 * 50 = 4950
    expect(result.current.scrollTop).toBe(expectedScrollTop);
  });

  it('should handle scroll events', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    const mockEvent = {
      currentTarget: {
        scrollTop: 250
      }
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.scrollTop).toBe(250);
  });

  it('should respect overscan parameter', () => {
    const { result: resultWithOverscan } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300,
      overscan: 5
    }));

    const { result: resultWithoutOverscan } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300,
      overscan: 0
    }));

    // With overscan, we should render more items
    expect(resultWithOverscan.current.virtualItems.length).toBeGreaterThan(
      resultWithoutOverscan.current.virtualItems.length
    );
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() => useVirtualScroll([], {
      itemHeight: 50,
      containerHeight: 300
    }));

    expect(result.current.virtualItems).toEqual([]);
    expect(result.current.totalHeight).toBe(0);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(-1); // Math.min(0-1, 0) = -1
  });

  it('should handle single item', () => {
    const singleItem = [{ id: 1, name: 'Single Item' }];
    const { result } = renderHook(() => useVirtualScroll(singleItem, {
      itemHeight: 50,
      containerHeight: 300
    }));

    expect(result.current.virtualItems.length).toBe(1);
    expect(result.current.totalHeight).toBe(50);
    expect(result.current.virtualItems[0].data).toEqual(singleItem[0]);
  });

  it('should calculate correct indices for large scroll positions', () => {
    const { result } = renderHook(() => useVirtualScroll(mockItems, {
      itemHeight: 50,
      containerHeight: 300
    }));

    act(() => {
      result.current.setScrollTop(2000);
    });

    // At scroll position 2000, we should be around item 40 (2000 / 50)
    // With overscan of 5, startIndex should be around 40-5 = 35
    expect(result.current.startIndex).toBeGreaterThanOrEqual(35);
    expect(result.current.startIndex).toBeLessThan(45);
  });

  it('should handle container height changes', () => {
    const { result, rerender } = renderHook(
      ({ containerHeight }) => useVirtualScroll(mockItems, {
        itemHeight: 50,
        containerHeight
      }),
      { initialProps: { containerHeight: 300 } }
    );

    const initialEndIndex = result.current.endIndex;

    rerender({ containerHeight: 600 });

    // With larger container, we should render more items
    expect(result.current.endIndex).toBeGreaterThan(initialEndIndex);
  });

  it('should handle item height changes', () => {
    const { result, rerender } = renderHook(
      ({ itemHeight }) => useVirtualScroll(mockItems, {
        itemHeight,
        containerHeight: 300
      }),
      { initialProps: { itemHeight: 50 } }
    );

    const initialTotalHeight = result.current.totalHeight;

    rerender({ itemHeight: 100 });

    // With larger item height, total height should increase
    expect(result.current.totalHeight).toBeGreaterThan(initialTotalHeight);
    expect(result.current.totalHeight).toBe(10000); // 100 items * 100px
  });

  it('should maintain scroll position when items change', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useVirtualScroll(items, {
        itemHeight: 50,
        containerHeight: 300
      }),
      { initialProps: { items: mockItems } }
    );

    // Set scroll position
    act(() => {
      result.current.setScrollTop(500);
    });

    const scrollTop = result.current.scrollTop;

    // Change items
    const newItems = [...mockItems, { id: 100, name: 'New Item' }];
    rerender({ items: newItems });

    // Scroll position should be maintained
    expect(result.current.scrollTop).toBe(scrollTop);
  });
}); 