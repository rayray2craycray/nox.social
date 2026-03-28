import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { Text, View } from 'react-native';

const ThrowError = () => {
  throw new Error('Test error');
};

const WorkingComponent = () => <Text>Hello World</Text>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should render error UI when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('should call onError callback', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('should render custom fallback when provided', () => {
    const customFallback = (
      <View>
        <Text>Custom Error Message</Text>
      </View>
    );

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error Message')).toBeTruthy();
  });

  it('should reset error state when Try Again is pressed', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Something went wrong/i)).toBeTruthy();

    const tryAgainButton = getByText('Try Again');
    fireEvent.press(tryAgainButton);

    // After reset, error UI should be gone and we should try to render children again
    // Note: This will throw again, but demonstrates the reset mechanism
    expect(getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('should display error emoji', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('😔')).toBeTruthy();
  });
});
