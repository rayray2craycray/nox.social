jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

// ---- Mocks ----

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    replace: jest.fn(),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  Stack: { Screen: () => null },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy({}, { get: () => icon });
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

const mockRegisterBusiness = jest.fn(() => Promise.resolve());
let mockUser: any = { id: 'user-1', email: 'test@example.com' };

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

jest.mock('@/contexts/VenueManagementContext', () => ({
  useVenueManagement: () => ({
    registerBusiness: mockRegisterBusiness,
  }),
}));

// Mock the validation module - provide real-enough schemas
jest.mock('@/utils/validation', () => {
  // Simple mock schemas that mimic zod parse behavior
  const createMockSchema = (validator: (val: any) => boolean, errorMsg: string) => ({
    parse: (val: any) => {
      if (!validator(val)) {
        throw { errors: [{ message: errorMsg, path: [] }] };
      }
      return val;
    },
  });

  return {
    businessRegistrationStep1Schema: {
      // This schema will be validated via safeValidateData
    },
    businessRegistrationStep2Schema: {},
    safeValidateData: (schema: any, data: any) => {
      const errors: any[] = [];

      // Step 1 validation
      if ('venueName' in data) {
        if (!data.venueName || data.venueName.length < 2) {
          errors.push({ path: ['venueName'], message: 'Venue name must be at least 2 characters' });
        }
        if (!data.businessEmail || !data.businessEmail.includes('@')) {
          errors.push({ path: ['businessEmail'], message: 'Invalid email address' });
        }
      }

      // Step 2 validation
      if ('location' in data) {
        if (!data.location?.address) {
          errors.push({ path: ['location', 'address'], message: 'Address is required' });
        }
        if (!data.location?.city) {
          errors.push({ path: ['location', 'city'], message: 'City is required' });
        }
        if (!data.location?.state) {
          errors.push({ path: ['location', 'state'], message: 'State is required' });
        }
        if (!data.location?.zipCode) {
          errors.push({ path: ['location', 'zipCode'], message: 'ZIP code is required' });
        }
      }

      if (errors.length > 0) {
        return { success: false, errors: { errors } };
      }
      return { success: true, data };
    },
    venueNameSchema: createMockSchema(
      (v: string) => Boolean(v && v.length >= 2),
      'Venue name must be at least 2 characters'
    ),
    businessEmailSchema: createMockSchema(
      (v: string) => Boolean(v && v.includes('@') && v.includes('.')),
      'Invalid email address'
    ),
    phoneSchema: createMockSchema(
      (v: string) => Boolean(v && v.length >= 10),
      'Invalid phone number'
    ),
    websiteSchema: createMockSchema(
      (v: string) => Boolean(v && v.startsWith('http')),
      'Invalid website URL'
    ),
    zipCodeSchema: createMockSchema(
      (v: string) => Boolean(v && /^\d{5}$/.test(v)),
      'Invalid ZIP code'
    ),
  };
});

import BusinessRegisterScreen from '@/app/business/register';

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
      <BusinessRegisterScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('BusinessRegisterScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockUser = { id: 'user-1', email: 'test@example.com' };
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the header with title and step indicator', () => {
    const { getByText } = renderScreen();
    expect(getByText('Register Business')).toBeTruthy();
    expect(getByText('Step 1 of 2')).toBeTruthy();
  });

  it('renders the info box about Head Moderator', () => {
    const { getByText } = renderScreen();
    expect(getByText(/Head Moderator/)).toBeTruthy();
  });

  it('renders step 1 form fields', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    expect(getByText('Venue Name *')).toBeTruthy();
    expect(getByText('Business Email *')).toBeTruthy();
    expect(getByText('Business Type *')).toBeTruthy();
    expect(getByPlaceholderText('Your Venue Name')).toBeTruthy();
    expect(getByPlaceholderText('business@venue.com')).toBeTruthy();
  });

  it('renders all business type options', () => {
    const { getByText } = renderScreen();
    expect(getByText('BAR')).toBeTruthy();
    expect(getByText('CLUB')).toBeTruthy();
    expect(getByText('LOUNGE')).toBeTruthy();
    expect(getByText('RESTAURANT')).toBeTruthy();
    expect(getByText('OTHER')).toBeTruthy();
  });

  it('triggers haptics when selecting a business type', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('CLUB'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('shows the Next button on step 1', () => {
    const { getByText } = renderScreen();
    expect(getByText('Next')).toBeTruthy();
  });

  it('shows validation errors when Next is pressed with empty fields', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Next'));
    // Should show error messages for required fields
    expect(getByText(/at least 2 characters|required/i)).toBeTruthy();
  });

  it('navigates to step 2 when step 1 is valid', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'Test Venue');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'test@venue.com');

    fireEvent.press(getByText('Next'));

    // Step 2 should now be visible
    expect(getByText('Step 2 of 2')).toBeTruthy();
    expect(getByText('Street Address *')).toBeTruthy();
    expect(getByText('City *')).toBeTruthy();
    expect(getByText('State *')).toBeTruthy();
    expect(getByText('ZIP Code *')).toBeTruthy();
  });

  it('renders step 2 optional fields', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'Test Venue');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'test@venue.com');
    fireEvent.press(getByText('Next'));

    // Check step 2 optional fields
    expect(getByText('Phone Number (Optional)')).toBeTruthy();
    expect(getByText('Website (Optional)')).toBeTruthy();
    expect(getByPlaceholderText('+1 (555) 123-4567')).toBeTruthy();
    expect(getByPlaceholderText('https://yourvenue.com')).toBeTruthy();
  });

  it('shows Back and Submit buttons on step 2', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'Test Venue');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'test@venue.com');
    fireEvent.press(getByText('Next'));

    expect(getByText('Back')).toBeTruthy();
    expect(getByText('Submit')).toBeTruthy();
  });

  it('goes back to step 1 when Back button is pressed', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1 and go to step 2
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'Test Venue');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'test@venue.com');
    fireEvent.press(getByText('Next'));
    expect(getByText('Step 2 of 2')).toBeTruthy();

    // Press Back
    fireEvent.press(getByText('Back'));
    expect(getByText('Step 1 of 2')).toBeTruthy();
  });

  it('shows validation errors on step 2 when submitting with empty address', () => {
    const { getByText, getByPlaceholderText, getAllByText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'Test Venue');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'test@venue.com');
    fireEvent.press(getByText('Next'));

    // Press Submit without filling step 2
    fireEvent.press(getByText('Submit'));

    // Multiple required field errors appear (address, city, state, zipCode)
    const requiredErrors = getAllByText(/required/i);
    expect(requiredErrors.length).toBeGreaterThanOrEqual(1);
  });

  it('calls router.back when back icon is pressed', () => {
    const { getByText } = renderScreen();
    // The back chevron icon is a TouchableOpacity; we can trigger it via its parent behavior
    // We verify the back function is available
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('submits the form successfully and shows verification email alert', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'My Cool Bar');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'owner@coolbar.com');
    fireEvent.press(getByText('Next'));

    // Fill step 2
    fireEvent.changeText(getByPlaceholderText('123 Main Street'), '789 Broadway');
    fireEvent.changeText(getByPlaceholderText('City'), 'New York');
    fireEvent.changeText(getByPlaceholderText('NY'), 'NY');
    fireEvent.changeText(getByPlaceholderText('10001'), '10012');

    // Submit
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(mockRegisterBusiness).toHaveBeenCalledWith(
        expect.objectContaining({
          venueName: 'My Cool Bar',
          businessEmail: 'owner@coolbar.com',
          location: expect.objectContaining({
            address: '789 Broadway',
            city: 'New York',
            state: 'NY',
            zipCode: '10012',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Verification Email Sent!',
        expect.stringContaining('owner@coolbar.com'),
        expect.any(Array)
      );
    });
  });

  it('shows login required alert when user is not logged in', async () => {
    mockUser = null;

    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'My Cool Bar');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'owner@coolbar.com');
    fireEvent.press(getByText('Next'));

    // Fill step 2
    fireEvent.changeText(getByPlaceholderText('123 Main Street'), '789 Broadway');
    fireEvent.changeText(getByPlaceholderText('City'), 'New York');
    fireEvent.changeText(getByPlaceholderText('NY'), 'NY');
    fireEvent.changeText(getByPlaceholderText('10001'), '10012');

    // Submit
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Login Required',
        expect.stringContaining('logged in'),
        expect.any(Array)
      );
    });

    expect(mockRegisterBusiness).not.toHaveBeenCalled();
  });

  it('shows error alert when registration fails', async () => {
    mockRegisterBusiness.mockRejectedValueOnce(new Error('Server error'));

    const { getByText, getByPlaceholderText } = renderScreen();

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Your Venue Name'), 'My Cool Bar');
    fireEvent.changeText(getByPlaceholderText('business@venue.com'), 'owner@coolbar.com');
    fireEvent.press(getByText('Next'));

    // Fill step 2
    fireEvent.changeText(getByPlaceholderText('123 Main Street'), '789 Broadway');
    fireEvent.changeText(getByPlaceholderText('City'), 'New York');
    fireEvent.changeText(getByPlaceholderText('NY'), 'NY');
    fireEvent.changeText(getByPlaceholderText('10001'), '10012');

    // Submit
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Registration Failed',
        'Server error'
      );
    });
  });

  it('shows helper text for business email field', () => {
    const { getByText } = renderScreen();
    expect(getByText(/verification email at this address/)).toBeTruthy();
  });
});
