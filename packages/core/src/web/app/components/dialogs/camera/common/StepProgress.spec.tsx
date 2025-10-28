import React from 'react';
import { render } from '@testing-library/react';

import StepProgress from './StepProgress';

describe('test StepProgress', () => {
  const mockSteps = ['Step 1', 'Step 2', 'Step 3', 'Step 4'];

  it('should render correctly with all steps', () => {
    const { baseElement, getByText } = render(<StepProgress currentStep={0} steps={mockSteps} />);

    expect(baseElement).toMatchSnapshot();

    // Verify all steps are rendered
    mockSteps.forEach((step) => {
      expect(getByText(step)).toBeInTheDocument();
    });
  });

  it('should render with custom className', () => {
    const { container } = render(<StepProgress className="custom-class" currentStep={0} steps={mockSteps} />);

    const containerElement = container.querySelector('.custom-class');

    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toMatchSnapshot();
  });

  it('should highlight only the first step when currentStep is 0', () => {
    const { container } = render(<StepProgress currentStep={0} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    // First step should be active
    expect(steps[0].className).toContain('active');

    // Other steps should not be active
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].className).not.toContain('active');
    }
  });

  it('should highlight first two steps when currentStep is 1', () => {
    const { container } = render(<StepProgress currentStep={1} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    // First two steps should be active
    expect(steps[0].className).toContain('active');
    expect(steps[1].className).toContain('active');

    // Remaining steps should not be active
    for (let i = 2; i < steps.length; i++) {
      expect(steps[i].className).not.toContain('active');
    }
  });

  it('should highlight all steps when currentStep is last step', () => {
    const { container } = render(<StepProgress currentStep={3} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    // All steps should be active
    steps.forEach((step) => {
      expect(step.className).toContain('active');
    });
  });

  it('should highlight all steps up to and including currentStep', () => {
    const { container } = render(<StepProgress currentStep={2} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    // First three steps should be active (index 0, 1, 2)
    for (let i = 0; i <= 2; i++) {
      expect(steps[i].className).toContain('active');
    }

    // Last step should not be active
    expect(steps[3].className).not.toContain('active');
  });

  it('should render with single step', () => {
    const { baseElement, getByText } = render(<StepProgress currentStep={0} steps={['Single Step']} />);

    expect(baseElement).toMatchSnapshot();
    expect(getByText('Single Step')).toBeInTheDocument();
  });

  it('should render each step with a bar element', () => {
    const { container } = render(<StepProgress currentStep={0} steps={mockSteps} />);

    const bars = container.querySelectorAll('[class*="bar"]');

    expect(bars.length).toBe(mockSteps.length);
  });

  it('should handle currentStep greater than steps length', () => {
    const { container } = render(<StepProgress currentStep={10} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    // All steps should be active when currentStep exceeds array length
    steps.forEach((step) => {
      expect(step.className).toContain('active');
    });
  });

  it('should update correctly when props change', () => {
    const { container, rerender } = render(<StepProgress currentStep={0} steps={mockSteps} />);

    let steps = container.querySelectorAll('[class*="step"]');

    expect(steps[0].className).toContain('active');
    expect(steps[1].className).not.toContain('active');

    // Update currentStep
    rerender(<StepProgress currentStep={1} steps={mockSteps} />);

    steps = container.querySelectorAll('[class*="step"]');
    expect(steps[0].className).toContain('active');
    expect(steps[1].className).toContain('active');
    expect(steps[2].className).not.toContain('active');
  });

  it('should maintain unique keys for each step', () => {
    const { container } = render(<StepProgress currentStep={0} steps={mockSteps} />);

    const steps = container.querySelectorAll('[class*="step"]');

    expect(steps.length).toBe(mockSteps.length);

    // Verify all steps are rendered (React would throw errors if keys weren't unique)
    mockSteps.forEach((stepText, index) => {
      expect(steps[index].textContent).toBe(stepText);
    });
  });
});
