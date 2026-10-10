# Spec Delta: document-upload-viewer

## Purpose

Enables faculty to upload, preview, and navigate multi-page scanned PDF documents and high-resolution images of university mark sheets on both desktop and mobile devices.

## ADDED Requirements

### Requirement: Multi-format document upload
The system SHALL accept PDF documents and common image files (PNG, JPG, JPEG, WEBP) via drag-and-drop, native file selector, and mobile camera capture.

#### Scenario: User uploads scanned PDF file
- **WHEN** user drags or selects a valid PDF file (such as EEE 2121 SEF.pdf) into the upload dropzone
- **THEN** system validates file type, reads page count, and renders preview thumbnails for all pages

#### Scenario: User uploads single image photo
- **WHEN** user selects a photo of a mark sheet from camera roll or file picker
- **THEN** system renders the image immediately in the viewer workspace

#### Scenario: User uploads unsupported file format
- **WHEN** user attempts to upload an unsupported file extension (e.g., .exe, .zip)
- **THEN** system rejects the upload with an informative visual warning and preserves the existing session

### Requirement: Interactive document viewer with zoom and pan
The system SHALL provide an interactive canvas viewer supporting multi-page navigation, zoom-in, zoom-out, fit-to-width, and touch pan/pinch gestures on mobile.

#### Scenario: Desktop examiner zooms into handwritten digits
- **WHEN** examiner clicks zoom-in or uses mouse scroll wheel over the document canvas
- **THEN** document scale increases smoothly up to 300% without losing visual clarity

#### Scenario: Mobile examiner pans document on touchscreen
- **WHEN** user touches and drags on the document viewport on a mobile device
- **THEN** canvas pans smoothly following touch coordinates with momentum bounds
