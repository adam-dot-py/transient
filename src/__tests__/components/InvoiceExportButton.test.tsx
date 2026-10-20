/**
 * Unit tests for the InvoiceExportButton component.
 *
 * The native PDF pipeline (expo-print / expo-sharing) is mocked via the
 * invoicePdfService module so the component renders under jest-expo without a
 * native runtime. We also mock expo-print and expo-sharing directly as a
 * belt-and-braces guard in case of transitive imports.
 *
 * Covered:
 *   • Hidden entirely when the musician is not accepted.
 *   • Disabled-with-reason when accepted but the payment is not yet 'paid'.
 *   • Enabled + triggers exportInvoicePdf when accepted AND paid.
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { InvoiceExportButton } from '@/components/InvoiceExportButton';
import { exportInvoicePdf } from '@/services/invoicePdfService';
import type { Gig, GigPayment } from '@/types';

// Native modules: mocked so nothing touches a native runtime.
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/invoice.pdf' }),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// The service that wraps the native pipeline — spy on the export call.
jest.mock('@/services/invoicePdfService', () => ({
  exportInvoicePdf: jest.fn().mockResolvedValue({ uri: 'file:///mock/invoice.pdf' }),
}));

const mockExportInvoicePdf = exportInvoicePdf as jest.MockedFunction<typeof exportInvoicePdf>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const gig: Gig = {
  id: 'gig-9',
  title: "Last Month's Rock Night",
  venueName: 'The Blue Note Lounge',
  addressLine1: '1 Jazz Lane',
  city: 'London',
  postcode: 'EC2A 2BB',
  country: 'UK',
  latitude: 51.52,
  longitude: -0.08,
  date: '2024-01-14',
  startTime: '20:00',
  endTime: '23:00',
  genres: ['rock'],
  pay: 225,
  description: 'A past gig',
  status: 'past',
  hosterId: 'hoster-1',
  acceptedMusicianIds: ['musician-1'],
};

const paidPayment: GigPayment = {
  id: 'gig-payment-1',
  gigId: 'gig-9',
  musicianId: 'musician-1',
  amountPence: 22500,
  currency: 'gbp',
  status: 'paid',
  invoiceNumber: null,
  paidAt: '2024-01-15T18:30:00.000Z',
  createdAt: '2024-01-15T18:00:00.000Z',
};

const pendingPayment: GigPayment = {
  ...paidPayment,
  id: 'gig-payment-2',
  status: 'pending',
  paidAt: null,
};

beforeEach(() => {
  mockExportInvoicePdf.mockClear();
});

describe('InvoiceExportButton', () => {
  it('renders nothing when the musician is not accepted for the gig', async () => {
    const result = await render(
      <InvoiceExportButton
        gig={gig}
        musicianId="musician-1"
        applicationStatus="pending"
        payment={null}
        sellerName="Rae Holloway"
        buyerName="The Blue Note Lounge"
      />
    );
    expect(result.toJSON()).toBeNull();
  });

  it('renders a disabled button with a reason when accepted but payment is not paid', async () => {
    const result = await render(
      <InvoiceExportButton
        gig={gig}
        musicianId="musician-1"
        applicationStatus="accepted"
        payment={pendingPayment}
        sellerName="Rae Holloway"
        buyerName="The Blue Note Lounge"
      />
    );

    expect(result.getByText('Export PDF invoice')).toBeTruthy();
    // The pending-payment reason from canGenerateInvoice is surfaced.
    expect(result.getByText(/not been received/i)).toBeTruthy();

    // Pressing the disabled (non-Pressable) control does nothing.
    fireEvent.press(result.getByText('Export PDF invoice'));
    expect(mockExportInvoicePdf).not.toHaveBeenCalled();
  });

  it('renders an enabled button and triggers exportInvoicePdf on press when accepted and paid', async () => {
    const result = await render(
      <InvoiceExportButton
        gig={gig}
        musicianId="musician-1"
        applicationStatus="accepted"
        payment={paidPayment}
        sellerName="Rae Holloway"
        buyerName="The Blue Note Lounge"
      />
    );

    const button = result.getByLabelText('Export PDF invoice');
    await act(async () => {
      fireEvent.press(button);
    });

    await waitFor(() => {
      expect(mockExportInvoicePdf).toHaveBeenCalledTimes(1);
    });

    // The invoice passed to the exporter carries the gig and parties.
    const invoiceArg = mockExportInvoicePdf.mock.calls[0][0];
    expect(invoiceArg.gigTitle).toBe("Last Month's Rock Night");
    expect(invoiceArg.seller.name).toBe('Rae Holloway');
    expect(invoiceArg.buyer.name).toBe('The Blue Note Lounge');
    expect(invoiceArg.totalPence).toBe(22500);
  });
});
