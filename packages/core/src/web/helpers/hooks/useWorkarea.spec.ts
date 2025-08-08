const mockState = { workarea: 'fbm1' };
const mockUseDocumentStore = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: mockUseDocumentStore,
}));

import useWorkarea from './useWorkarea';

describe('test useWorkarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDocumentStore.mockImplementation((selector = (state) => state) => {
      return selector(mockState);
    });
  });

  it('should return workarea', () => {
    const result = useWorkarea();

    expect(result).toEqual('fbm1');
  });
});
