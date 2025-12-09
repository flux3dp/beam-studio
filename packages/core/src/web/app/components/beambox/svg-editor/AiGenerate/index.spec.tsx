import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import AiGenerate from './index';
import { useAiGenerateStore } from './useAiGenerateStore';

// --- Mocks ---
jest.mock('@core/helpers/api/ai-image', () => ({
  createAiImageTask: jest.fn(),
  getAiImageHistory: jest.fn(),
  pollTaskUntilComplete: jest.fn(),
}));
jest.mock('@core/app/actions/dialog-caller', () => ({ showStyleSelectionPanel: jest.fn() }));
jest.mock('@core/helpers/api/flux-id', () => ({
  fluxIDEvents: { off: jest.fn(), on: jest.fn() },
  getCurrentUser: jest.fn(),
  getInfo: jest.fn(),
}));
jest.mock('@core/app/svgedit/operations/import/importAiImage', () => ({ importAiImage: jest.fn() }));
jest.mock('@core/implementations/browser', () => ({ open: jest.fn() }));
jest.mock('./components/ImageHistory', () => () => <div data-testid="mock-history" />);
jest.mock('./components/ImageResults', () => () => <div data-testid="mock-results" />);
jest.mock('./components/InputField.upload', () => () => <div data-testid="mock-description-upload" />);
jest.mock('./hooks/useAiConfigQuery', () => ({ useAiConfigQuery: jest.fn() }));

import dialogCaller from '@core/app/actions/dialog-caller';
import { createAiImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import { useAiConfigQuery } from './hooks/useAiConfigQuery';

// --- Constants & Helpers ---
const MOCK_USER = { email: 'test@e.com', info: { credit: 1.0, email: 'test@e.com' } };
const MOCK_STYLES = [
  {
    displayName: 'Customize',
    id: 'customize',
    inputFields: [{ key: 'desc', label: 'Desc' }],
    modes: ['text-to-image'],
  },
];

const setupEditMode = () => {
  (useAiConfigQuery as jest.Mock).mockReturnValue({
    data: {
      styles: [
        {
          ...MOCK_STYLES[0],
          inputFields: [{ key: 'description', label: 'Description' }],
          modes: ['text-to-image', 'edit'],
        },
      ],
    },
    isLoading: false,
  });
};

describe('AiGenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAiGenerateStore.getState().resetForm();
    (getCurrentUser as jest.Mock).mockReturnValue(MOCK_USER);
    (createAiImageTask as jest.Mock).mockResolvedValue({ uuid: '123' });
    (pollTaskUntilComplete as jest.Mock).mockResolvedValue({ imageUrls: ['url'], success: true });
    (useAiConfigQuery as jest.Mock).mockReturnValue({
      data: { styles: MOCK_STYLES },
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    test.each([
      ['AI Create', '.title'],
      ['Customize', '.style-selection-button'],
      ['Style & Mode', '.section-title'],
      ['Laser-Friendly', '.toggle span'],
    ])('renders text "%s"', (text, selector) => {
      const { container } = render(<AiGenerate />);

      if (selector.startsWith('.')) {
        expect(container.querySelector(selector)).toHaveTextContent(text);
      } else {
        expect(container).toHaveTextContent(text);
      }
    });

    test('renders history view when toggled', () => {
      useAiGenerateStore.setState({ showHistory: true });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-history')).toBeInTheDocument();
    });

    test('conditionally renders description with upload based on mode: text-to-image', () => {
      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-description-upload')).not.toBeInTheDocument();
    });

    test('conditionally renders description with upload based on mode: edit', () => {
      setupEditMode();

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-description-upload')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('opens style panel', () => {
      const { container } = render(<AiGenerate />);

      fireEvent.click(container.querySelector('.style-selection-button')!);
      expect(dialogCaller.showStyleSelectionPanel).toHaveBeenCalled();
    });

    test('updates form fields', () => {
      const { container } = render(<AiGenerate />);
      const textarea = container.querySelector('textarea')!;

      fireEvent.change(textarea, { target: { value: 'New Prompt' } });
      expect(useAiGenerateStore.getState().inputFields.desc).toBe('New Prompt');
    });

    test('toggles laser friendly', () => {
      const { container } = render(<AiGenerate />);

      fireEvent.click(container.querySelector('.ant-switch')!);
      expect(useAiGenerateStore.getState().isLaserFriendly).toBe(true);
    });
  });

  describe('Generation Flow', () => {
    test('successful generation flow', async () => {
      useAiGenerateStore.setState({ inputFields: { desc: 'test' } });

      const { getByText } = render(<AiGenerate />);

      fireEvent.click(getByText('Generate'));

      await waitFor(() => {
        expect(createAiImageTask).toHaveBeenCalled();
        expect(pollTaskUntilComplete).toHaveBeenCalledWith('123', expect.any(Function));
        expect(useAiGenerateStore.getState().generatedImages).toEqual(['url']);
      });
    });

    test('handles api errors', async () => {
      (createAiImageTask as jest.Mock).mockResolvedValue({ error: 'API Fail' });
      useAiGenerateStore.setState({ inputFields: { desc: 'test' } });

      const { getByText } = render(<AiGenerate />);

      fireEvent.click(getByText('Generate'));

      await waitFor(() => {
        expect(useAiGenerateStore.getState().errorMessage).toBe('API Fail');
      });
    });
  });
});
