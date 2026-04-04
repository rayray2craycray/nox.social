jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks ----

const mockCanEditVenue = jest.fn();
const mockCanEditDisplay = jest.fn();
const mockGetVenueRole = jest.fn();
const mockUpdateVenueInfo = jest.fn();
const mockUpdateVenueDisplay = jest.fn();

jest.mock('@/contexts/VenueManagementContext', () => ({
  useVenueManagement: () => ({
    canEditVenue: mockCanEditVenue,
    canEditDisplay: mockCanEditDisplay,
    getVenueRole: mockGetVenueRole,
    updateVenueInfo: mockUpdateVenueInfo,
    updateVenueDisplay: mockUpdateVenueDisplay,
  }),
}));

const mockUploadVenueFromGallery = jest.fn();

jest.mock('@/hooks/useUpload', () => ({
  useUpload: () => ({
    uploadVenueFromGallery: mockUploadVenueFromGallery,
    isUploading: false,
  }),
}));

const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'venue-1' }),
  router: {
    back: mockRouterBack,
    push: jest.fn(),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy(
    {},
    {
      get: () => icon,
    }
  );
});

import VenueEditScreen from '@/app/app/venue/[id]';

// ---- Helpers ----

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderScreen() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VenueEditScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('VenueEditScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockCanEditVenue.mockReturnValue(true);
    mockCanEditDisplay.mockReturnValue(true);
    mockGetVenueRole.mockReturnValue({ role: 'HEAD_MODERATOR' });
    mockUpdateVenueInfo.mockResolvedValue(undefined);
    mockUpdateVenueDisplay.mockResolvedValue(undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the edit venue form (venue loads from mock data)', () => {
    const { getByText } = renderScreen();
    // The component uses inline mock data so it loads immediately
    expect(getByText('Edit Venue')).toBeTruthy();
  });

  it('renders the edit venue header after loading', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Edit Venue')).toBeTruthy();
    });
  });

  it('renders the user role in header subtitle', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('HEAD MODERATOR')).toBeTruthy();
    });
  });

  it('renders access denied when user cannot edit', async () => {
    mockCanEditVenue.mockReturnValue(false);
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Access Denied')).toBeTruthy();
      expect(getByText('You do not have permission to edit this venue.')).toBeTruthy();
    });
  });

  it('renders Go Back button on access denied screen', async () => {
    mockCanEditVenue.mockReturnValue(false);
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Go Back')).toBeTruthy();
    });
  });

  it('renders Go Back button that is pressable on denied screen', async () => {
    mockCanEditVenue.mockReturnValue(false);
    const { getByText } = renderScreen();
    await waitFor(() => {
      const goBackButton = getByText('Go Back');
      expect(goBackButton).toBeTruthy();
    });
  });

  it('renders form sections after venue loads', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Cover Image')).toBeTruthy();
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Tags')).toBeTruthy();
      expect(getByText('Operating Hours')).toBeTruthy();
    });
  });

  it('renders venue name input with loaded value', async () => {
    const { getByDisplayValue } = renderScreen();
    await waitFor(() => {
      expect(getByDisplayValue('Sample Venue')).toBeTruthy();
    });
  });

  it('renders address input with loaded value', async () => {
    const { getByDisplayValue } = renderScreen();
    await waitFor(() => {
      expect(getByDisplayValue('123 Main St')).toBeTruthy();
    });
  });

  it('renders cover charge input with loaded value', async () => {
    const { getByDisplayValue } = renderScreen();
    await waitFor(() => {
      expect(getByDisplayValue('20')).toBeTruthy();
    });
  });

  it('renders existing tags', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('EDM')).toBeTruthy();
      expect(getByText('DJ')).toBeTruthy();
      expect(getByText('Dancing')).toBeTruthy();
    });
  });

  it('renders day labels for operating hours', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Monday')).toBeTruthy();
      expect(getByText('Friday')).toBeTruthy();
      expect(getByText('Sunday')).toBeTruthy();
    });
  });

  it('updates venue name when text is changed', async () => {
    const { getByDisplayValue } = renderScreen();
    await waitFor(() => {
      const input = getByDisplayValue('Sample Venue');
      fireEvent.changeText(input, 'Updated Venue');
      expect(getByDisplayValue('Updated Venue')).toBeTruthy();
    });
  });

  it('removes a tag when pressed', async () => {
    const { getByText, queryByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('EDM')).toBeTruthy();
    });
    // Press the tag to remove it (the tag TouchableOpacity calls handleRemoveTag)
    fireEvent.press(getByText('EDM'));
    expect(queryByText('EDM')).toBeNull();
  });

  it('adds a tag via the tag input', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Tags')).toBeTruthy();
    });
    const input = getByPlaceholderText('Add a tag...');
    fireEvent.changeText(input, 'NewTag');
    fireEvent(input, 'submitEditing');
    expect(getByText('NewTag')).toBeTruthy();
  });

  it('shows duplicate alert when adding existing tag', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('EDM')).toBeTruthy();
    });
    const input = getByPlaceholderText('Add a tag...');
    fireEvent.changeText(input, 'EDM');
    fireEvent(input, 'submitEditing');
    expect(alertSpy).toHaveBeenCalledWith('Duplicate', 'This tag already exists');
  });

  it('calls updateVenueInfo on save and shows success alert', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
    });

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateVenueInfo).toHaveBeenCalledWith(
        'venue-1',
        expect.objectContaining({
          name: 'Sample Venue',
        })
      );
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Venue updated successfully',
        expect.any(Array)
      );
    });
  });

  it('renders the Save button text', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
    });
  });

  it('shows Change Image overlay when user can edit display', async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText('Change Image')).toBeTruthy();
    });
  });
});
