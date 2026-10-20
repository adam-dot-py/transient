import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Colors, SemanticColors, Spacing } from '@/constants/theme';
import { buildInvoice, canGenerateInvoice } from '@/data/invoiceService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { exportInvoicePdf } from '@/services/invoicePdfService';
import type { ApplicationStatus, Gig, GigPayment, InvoiceParty } from '@/types';

interface InvoiceExportButtonProps {
  /** The gig the invoice is for. */
  gig: Gig;
  /** The current musician's id (the invoice seller). */
  musicianId: string;
  /** The musician's application status for this gig. */
  applicationStatus: ApplicationStatus;
  /** The musician's payment record for this gig, or null if none exists. */
  payment: GigPayment | null;
  /** Display name of the seller (the musician). */
  sellerName: string;
  /** Display name of the buyer (the hoster / venue). */
  buyerName: string;
}

/**
 * InvoiceExportButton — lets an accepted + paid musician export a PDF invoice.
 *
 * ─── Gating (invoiceService.canGenerateInvoice) ──────────────────────────────
 * Rendering is gated on the shared business rule:
 *   • Not accepted for the gig  → renders NOTHING (the control is irrelevant,
 *     so we avoid cluttering the screen for musicians who were not selected).
 *   • Accepted but payment not yet 'paid' → renders a DISABLED button with the
 *     reason, so the musician understands the invoice is pending payment.
 *   • Accepted AND paid → renders an ENABLED "Export PDF invoice" button.
 *
 * On press it assembles the Invoice via invoiceService.buildInvoice (building
 * InvoiceParty objects from the seller/buyer names and the gig address for the
 * buyer) and hands it to invoicePdfService.exportInvoicePdf, showing an
 * ActivityIndicator while running and an inline error on failure. The native
 * expo-print / expo-sharing modules stay isolated inside invoicePdfService.
 */
export function InvoiceExportButton({
  gig,
  musicianId,
  applicationStatus,
  payment,
  sellerName,
  buyerName,
}: InvoiceExportButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibility = useMemo(
    () =>
      canGenerateInvoice({
        applicationStatus,
        acceptedMusicianIds: gig.acceptedMusicianIds,
        musicianId,
        payment,
      }),
    [applicationStatus, gig.acceptedMusicianIds, musicianId, payment]
  );

  const handleExport = useCallback(async () => {
    if (!payment || !eligibility.allowed) return;

    setIsExporting(true);
    setError(null);

    try {
      const seller: InvoiceParty = {
        name: sellerName,
        addressLines: [],
      };
      const buyer: InvoiceParty = {
        name: buyerName,
        addressLines: [gig.venueName, gig.addressLine1, gig.city, gig.postcode].filter(
          (line): line is string => !!line && line.trim().length > 0
        ),
      };

      const invoice = buildInvoice({ gig, musician: seller, hoster: buyer, payment });
      await exportInvoicePdf(invoice);
    } catch (err: any) {
      setError(err?.message ?? 'Could not export the invoice. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [buyerName, eligibility.allowed, gig, payment, sellerName]);

  // Not accepted → render nothing (see component doc).
  const isAccepted =
    applicationStatus === 'accepted' && gig.acceptedMusicianIds.includes(musicianId);
  if (!isAccepted) {
    return null;
  }

  // Accepted but not payable yet → disabled button with the reason.
  if (!eligibility.allowed) {
    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.button,
            styles.buttonDisabled,
            { backgroundColor: colors.backgroundElement },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Export PDF invoice, unavailable"
        >
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
            Export PDF invoice
          </Text>
        </View>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
          {eligibility.reason}
        </Text>
      </View>
    );
  }

  // Accepted and paid → enabled export control.
  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.button, { backgroundColor: Brand.purple }, isExporting && styles.buttonBusy]}
        onPress={handleExport}
        disabled={isExporting}
        accessibilityRole="button"
        accessibilityLabel="Export PDF invoice"
      >
        {isExporting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.buttonTextLight]}>Export PDF invoice</Text>
          </>
        )}
      </Pressable>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={semantic.accentRed} />
          <Text style={[styles.errorText, { color: semantic.accentRed }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.four,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonBusy: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextLight: {
    color: '#FFFFFF',
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
