export const useVirtualScroll = jest.fn(() => ({
  virtualItems: [],
  totalHeight: 0,
  startIndex: 0,
  endIndex: 0,
  scrollTop: 0,
  setScrollTop: jest.fn(),
  containerRef: { current: null },
  scrollToItem: jest.fn(),
  scrollToTop: jest.fn(),
  scrollToBottom: jest.fn(),
  handleScroll: jest.fn(),
})); 