# Requirements Document

## Introduction

This feature enhances the Transient app's address handling by replacing the single free-text `address` field with structured address components (Address Line 1, Address Line 2, City, Postcode, Country). It also adds a map pin to the gig detail screen so musicians can visually see where a gig is located before accepting it. These changes improve data quality for future search/filter features and provide a better user experience when evaluating gigs.

## Glossary

- **Structured_Address**: An address representation consisting of discrete fields: addressLine1, addressLine2 (optional), city, postcode, and country
- **Address_Form**: The set of input fields in the Create Gig screen used to capture structured address components
- **Gig_Detail_Screen**: The screen displayed when a musician taps a gig to view its full details and optionally accept it (route: `/gig/[id]`)
- **Create_Gig_Screen**: The screen used by hosters to create a new gig listing (route: `/gig/create`)
- **Map_Pin**: A map marker rendered on a MapView component indicating the geographic location of a gig
- **Location_Map**: A non-interactive MapView displayed on the Gig Detail Screen showing the gig location
- **Gig_Model**: The TypeScript interface defining the shape of a gig object used throughout the application
- **Validation_Service**: The module responsible for validating gig input fields before creation

## Requirements

### Requirement 1: Structured Address in Gig Model

**User Story:** As a developer, I want the Gig data model to use structured address fields instead of a single string, so that address components can be individually validated, searched, and displayed.

#### Acceptance Criteria

1. THE Gig_Model SHALL include an `addressLine1` field of type string with a maximum length of 100 characters
2. THE Gig_Model SHALL include an `addressLine2` field of type string with a maximum length of 100 characters, where the field is optional
3. THE Gig_Model SHALL include a `city` field of type string with a maximum length of 50 characters
4. THE Gig_Model SHALL include a `postcode` field of type string with a maximum length of 15 characters
5. THE Gig_Model SHALL include a `country` field of type string with a maximum length of 60 characters
6. THE Gig_Model SHALL remove the existing single `address` field of type string

### Requirement 2: Structured Address Input on Create Gig Screen

**User Story:** As a hoster, I want to enter address details in separate fields when creating a gig, so that the address information is accurate and consistently formatted.

#### Acceptance Criteria

1. THE Create_Gig_Screen SHALL display separate text input fields for Address Line 1 (maximum 100 characters), Address Line 2 (maximum 100 characters), City (maximum 50 characters), Postcode (maximum 15 characters), and Country (maximum 60 characters)
2. THE Create_Gig_Screen SHALL mark Address Line 1, City, Postcode, and Country as required fields with a visible required indicator
3. THE Create_Gig_Screen SHALL mark Address Line 2 as an optional field
4. IF a hoster submits the form with any required address field empty, THEN THE Validation_Service SHALL return a validation error identifying each empty required field
5. IF a hoster submits the form with an address field exceeding its maximum character length, THEN THE Validation_Service SHALL return a validation error indicating the maximum allowed length for that field
6. THE Create_Gig_Screen SHALL display each address field validation error directly below the corresponding input field

### Requirement 3: Structured Address Display on Gig Detail Screen

**User Story:** As a musician, I want to see the full structured address on the gig detail screen, so that I know exactly where the gig is located.

#### Acceptance Criteria

1. THE Gig_Detail_Screen SHALL display the structured address as a comma-separated string in the order: addressLine1, addressLine2, city, postcode, country
2. IF addressLine2 is empty or not provided, THEN THE Gig_Detail_Screen SHALL omit addressLine2 and its associated separator from the formatted address without rendering an extra comma or whitespace in its place
3. IF any other address field (city, postcode, or country) is empty or not provided, THEN THE Gig_Detail_Screen SHALL omit that field and its associated separator from the formatted address without rendering an extra comma or whitespace in its place

### Requirement 4: Map Pin on Gig Detail Screen

**User Story:** As a musician, I want to see a map with a pin showing the gig location on the detail screen, so that I can visually assess how far the gig is and where it is.

#### Acceptance Criteria

1. THE Gig_Detail_Screen SHALL display a Location_Map showing the gig's geographic position using the existing latitude and longitude fields
2. THE Location_Map SHALL display a Map_Pin centered on the gig's latitude and longitude coordinates
3. THE Location_Map SHALL render at a zoom level corresponding to a latitudeDelta and longitudeDelta of 0.01
4. THE Location_Map SHALL have a fixed height of 200 points and span the full available width of the content area
5. THE Location_Map SHALL be positioned below the address details and above the action section on the Gig Detail Screen, after the description section if one is present
6. IF the latitude or longitude is missing, zero, or outside valid geographic bounds (latitude outside -90 to 90, longitude outside -180 to 180), THEN THE Gig_Detail_Screen SHALL hide the Location_Map entirely rather than displaying an error
7. THE Location_Map SHALL be non-interactive, preventing user panning, zooming, or scrolling on the map

### Requirement 5: Update Mock Data and Existing Gigs

**User Story:** As a developer, I want the existing mock gig data updated to use structured address fields, so that the app functions correctly during development without a backend migration.

#### Acceptance Criteria

1. THE mock gig data SHALL replace each existing single `address` string field with the following structured address fields: `addressLine1` (street number and name, max 100 characters), `addressLine2` (secondary component such as suite or floor, max 100 characters), `city` (max 50 characters), `postcode` (max 15 characters), and `country` (max 60 characters)
2. THE mock gig data SHALL populate `addressLine2` with the secondary component value for any gig whose original address contained a suite number, floor, unit, or apartment identifier
3. THE mock gig data SHALL set `addressLine2` to an empty string for gigs where the original address contains no secondary component
4. WHEN the mock data is updated, THE gig creation validation SHALL require `addressLine1`, `city`, `postcode`, and `country` as non-empty fields, and SHALL treat `addressLine2` as optional

### Requirement 6: Update CreateGigInput Type

**User Story:** As a developer, I want the CreateGigInput type to reflect the new structured address fields, so that the form and validation logic use consistent types.

#### Acceptance Criteria

1. THE CreateGigInput type SHALL include addressLine1 (maximum 100 characters), city (maximum 50 characters), postcode (maximum 15 characters), and country (maximum 60 characters) as required string fields
2. THE CreateGigInput type SHALL include addressLine2 as an optional string field with a maximum length of 100 characters
3. THE CreateGigInput type SHALL remove the existing single `address` field
