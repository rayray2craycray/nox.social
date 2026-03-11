import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlowProvider, useGlow } from '../GlowContext';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props: any) => <View {...props} />,
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <GlowProvider>{children}</GlowProvider>
  );
}

describe('GlowContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide triggerGlow and GlowOverlay', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    expect(typeof result.current.triggerGlow).toBe('function');
    expect(typeof result.current.GlowOverlay).toBe('function');
  });

  it('should render null GlowOverlay when glow is not active', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    const overlay = result.current.GlowOverlay();
    expect(overlay).toBeNull();
  });

  it('should activate glow when triggerGlow is called', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow();
    });

    // After triggering, overlay should not be null
    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });

  it('should trigger haptic feedback on glow', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow();
    });

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('should accept pink color option', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({ color: 'pink' });
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });

  it('should accept purple color option', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({ color: 'purple' });
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });

  it('should accept gold color option', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({ color: 'gold' });
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });

  it('should accept white color option', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({ color: 'white' });
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });

  it('should accept custom intensity and duration options', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({ intensity: 0.8, duration: 1200 });
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('should use default options when none provided', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGlow(), { wrapper });

    act(() => {
      result.current.triggerGlow({});
    });

    const overlay = result.current.GlowOverlay();
    expect(overlay).not.toBeNull();
  });
});
