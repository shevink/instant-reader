# instant-reader
a lightweight RSVP reader

## What?
Instant Reader is a small, privacy-focused RSVP (Rapid Serial Visual Presentation) web application. Files never leave your machine and are read through your browser.

## Features
- PDF, EPUB, TXT, and HTML upload by file picker or drag-and-drop
- One-word RSVP with a highlighted focal letter, or groups of 2–5 words
- Reading speed from 80 to 1,000 WPM; sans serif, serif, or monospace; 24–120 px font size
- Five preset focal-letter colours and punctuation-aware pauses
- Reading settings remembered automatically in browser
- Resume or start over when reopening the same file
- Click the page or chapter number to jump to it
- Play/pause, previous/next, seek bar, estimated remaining time
- Press Space to play or pause, left/right to seek, Shift + left/right to jump by sentence, and up/down to change speed.
- Press S to find a word or phrase, F for full screen, R to reset, and N to open another file

## Limitations
Scanned, image-only PDFs need OCR first. Multicolumn documents, scientific equations, tables and complex layouts can have imperfect reading order. EPUBs need readable, unencrypted text and can be up to 50 MB. Settings and up to 100 reading positions are saved in browser. Clearing browser storage clears these preferences and positions. 

PDF.js: <https://mozilla.github.io/pdf.js/> (Apache-2.0 license). Poppler: GPL; PyMuPDF: AGPL/commercial. 
The EPUB reader bundles [fflate 0.8.3](https://github.com/101arrowz/fflate/tree/v0.8.3) under the [MIT license](vendor/fflate-LICENSE.txt).

