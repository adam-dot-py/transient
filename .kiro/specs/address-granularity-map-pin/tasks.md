# Implementation Plan: Address Granularity & Map Pin

## Overview

This plan migrates the single free-text `address` field to structured address components (addressLine1, addressLine2, city, postcode, country) across the type layer, validation service, mock data, create form, and detail screen. It also adds a static map pin (`LocationMap`) to the gig detail screen. Tasks are ordered so each step builds on the previous — types first, then service logic, then UI.

## Tasks

- [x] 1. Update type definitions and core service functions
  - [x] 1.1 Update `Gig` and `CreateGigInput` interfaces in `src/types/index.ts`
    - Replace `address: string` with `addressLine1: string`, `addressLine2?: string`, `city: string`, `postcode: string`, `country: string` on both interfaces
    - Add max-length comments matching the design constraints
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3_

  - [x] 1.2 Add `formatStructuredAddress` function to `src/data/gigService.ts`
    - Implement pure function that joins non-empty fields with `, ` in order: addressLine1, addressLine2, city, postcode, country
    - Omit empty/undefined fields — no double commas or trailing commas
    - Export the function
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.3 Add `isValidCoordinate` function to `src/data/gigService.ts`
    - Return true only when latitude is in [-90, 90], longitude is in [-180, 180], and neither is exactly zero
    - Export the function
    - _Requirements: 4.6_

  - [x] 1.4 Update `validateGigInput` in `src/data/gigService.ts` for structured address fields
    - Remove the single `address` validation check
    - Add required-field checks for `addressLine1`, `city`, `postcode`, `country` (empty/whitespace → error)
    - Add max-length checks: addressLine1 ≤100, addressLine2 ≤100, city ≤50, postcode ≤15, country ≤60
    - `addressLine2` is optional — only validate max-length if provided
    - Update the `createGig` function to use new fields instead of `address`
    - _Requirements: 2.4, 2.5, 5.4_

- [x] 2. Checkpoint - Ensure type layer compiles cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Update mock data and existing tests
  - [x] 3.1 Migrate `src/data/mockGigs.ts` to structured address fields
    - Replace each `address` string with `addressLine1`, `addressLine2`, `city`, `postcode`, `country`
    - Parse existing address strings into components (street → addressLine1, city/state/zip → city, postcode, country)
    - Set `addressLine2` to empty string where no secondary component exists
    - Set `country` to `'USA'` for all Nashville mock gigs
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Update existing test files that reference `address` field
    - Fix any references to the old `address` field in `src/__tests__/data/gigService.test.ts` and `src/__tests__/components/GigCard.test.tsx`
    - Update test fixtures to use structured address fields
    - _Requirements: 1.6, 6.3_

- [x] 4. Implement UI changes
  - [x] 4.1 Create `LocationMap` component at `src/components/LocationMap.tsx`
    - Accept `latitude` and `longitude` props
    - Render a `MapView` with a single `Marker` at the provided coordinates
    - Set `latitudeDelta` and `longitudeDelta` to 0.01
    - Fixed height of 200, full width
    - Disable all user interaction: `scrollEnabled={false}`, `zoomEnabled={false}`, `rotateEnabled={false}`, `pitchEnabled={false}`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

  - [x] 4.2 Update gig detail screen `src/app/gig/[id].tsx`
    - Import `formatStructuredAddress` and `isValidCoordinate` from `@/data/gigService`
    - Replace `gig.address` display with `formatStructuredAddress(gig)`
    - Conditionally render `LocationMap` below address/description and above action section when `isValidCoordinate(gig.latitude, gig.longitude)` is true
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.5, 4.6_

  - [x] 4.3 Update create gig form `src/app/gig/create.tsx` for structured address inputs
    - Replace single address `TextInput` with 5 fields: Address Line 1, Address Line 2, City, Postcode, Country
    - Set `maxLength` props matching constraints (100, 100, 50, 15, 60)
    - Mark Address Line 1, City, Postcode, Country as required (visible indicator in label)
    - Mark Address Line 2 as optional (label suffix)
    - Display per-field validation errors below each input
    - Update `handleSubmit` to pass structured fields to `validateGigInput`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.4 Update `src/components/GigCard.tsx` address display
    - Import `formatStructuredAddress` and use it (or display city only) instead of `gig.address`
    - _Requirements: 3.1_

- [x] 5. Checkpoint - Ensure all tests pass and app compiles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Property-based tests
  - [x] 6.1 Write property test for max-length validation
    - **Property 1: Address field max-length validation**
    - Generate random strings exceeding each field's max length; assert `validateGigInput` returns an error for that field
    - Test file: `src/__tests__/data/addressValidation.property.test.ts`
    - Use `fast-check` with `numRuns: 100`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.5**

  - [x] 6.2 Write property test for required field validation
    - **Property 2: Required address field validation**
    - Generate inputs with random subsets of required address fields empty/whitespace; assert errors for exactly those fields
    - Test file: `src/__tests__/data/addressValidation.property.test.ts`
    - Use `fast-check` with `numRuns: 100`
    - **Validates: Requirements 2.4, 5.4**

  - [x] 6.3 Write property test for address formatting
    - **Property 3: Address formatting with optional field omission**
    - Generate random `StructuredAddress` objects with optional empty fields; assert output has no double commas, no leading/trailing separators, correct field order
    - Test file: `src/__tests__/data/formatAddress.property.test.ts`
    - Use `fast-check` with `numRuns: 100`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 6.4 Write property test for coordinate validity
    - **Property 4: Coordinate validity determines map visibility**
    - Generate random lat/lng pairs spanning valid, invalid, boundary, and zero values; assert `isValidCoordinate` returns true iff lat in [-90,90] AND lng in [-180,180] AND neither is zero
    - Test file: `src/__tests__/data/coordinateValidation.property.test.ts`
    - Use `fast-check` with `numRuns: 100`
    - **Validates: Requirements 4.6**

- [x] 7. Unit tests
  - [x] 7.1 Write unit tests for `LocationMap` component
    - Test file: `src/__tests__/components/LocationMap.test.tsx`
    - Verify props passed to MapView and Marker
    - Verify non-interactive flags are set
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

  - [x] 7.2 Write unit tests for gig detail address display and map visibility
    - Test file: `src/__tests__/components/GigDetail.test.tsx`
    - Verify formatted address renders correctly
    - Verify map visible when coordinates valid, hidden when invalid/zero
    - _Requirements: 3.1, 4.5, 4.6_

  - [x] 7.3 Write unit tests for create gig form address fields
    - Test file: `src/__tests__/components/CreateGigForm.test.tsx`
    - Verify 5 address inputs present with correct maxLength
    - Verify required indicators shown on required fields
    - Verify optional label on Address Line 2
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific UI rendering concerns and edge cases
- The design uses TypeScript throughout, matching the existing codebase

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3"] }
  ]
}
```
