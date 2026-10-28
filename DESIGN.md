---
name: Shipping Reliable Products (workshop deck)
description: Every slide is one kitchen order ticket; thermal paper, thermal ink, dashed tear rules. Scope is deck/ only.
colors:
  paper: "#fbfaf6"
  paper-2: "#efede6"
  ink: "#1f1e24"
  ink-2: "#47464d"
  ink-3: "#66656b"
  ink-4: "#a6a5a9"
  ink-5: "#dddbd4"
  you: "#c4372a"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 75"
  headline:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "64px"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0em"
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.32
  body-sm:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.32
  label:
    fontFamily: "Spline Sans Mono, ui-monospace, Menlo, monospace"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.05em"
  label-sm:
    fontFamily: "Spline Sans Mono, ui-monospace, Menlo, monospace"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
  code:
    fontFamily: "Spline Sans Mono, ui-monospace, Menlo, monospace"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  none: "0px"
spacing:
  slide-x: "96px"
  slide-top: "132px"
  slide-bottom: "64px"
  header-top: "40px"
  block: "40px"
  column-gap: "32px"
  row-pad: "14px"
components:
  ticket-header:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0 0 18px"
  tag-you:
    textColor: "{colors.you}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "4px 7px"
  tag-agent:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "4px 7px"
  tag-both:
    textColor: "{colors.ink-3}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "4px 7px"
  fire-marker:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  agent-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    padding: "3px 9px 4px"
  agent-slice:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "30px 22px"
  btw-ticket:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  plate:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "356px"
---

# Design System: Shipping Reliable Products (workshop deck)

Scope: the projected deck in `deck/` (reveal.js 5.1, fixed 1280x720 canvas, `deck/theme.css`, `deck/slides.md`, plates in `deck/images/kot/`). The companion page (`workshop-page/`, reliable-products-workshop) is a separate surface with its own older dark style and is not governed by this file.

## Overview

**Creative North Star: "The Kitchen Order Ticket"**

Every slide is one order ticket handed to the kitchen, because an agent will cook. The ground is thermal paper, the type is thermal ink, and the only structure is what a ticket printer can make: a running header, dashed tear rules, a perforated foot, reverse-printed bars. The room reads one order at a time and always knows where it is from the header: order number left, running section centre.

The deck is sparse by design. A slide carries one headline, one supporting line, and at most one structure (a split, a ladder, a table, a strip, a plate). Section openers are mostly blank stock with the headline sitting low. Detail lives in the speaker's mouth and the notes, not on the paper.

Who did the work is the one semantic distinction the world encodes: the human prints in red thermal ink, the agent prints in reverse (paper on an ink bar). Everything else is ink on paper.

**Key Characteristics:**
- Thermal paper ground, a five-step ink ramp, one red ink for the human.
- Condensed Archivo 800 headlines, Archivo 400 lines, Spline Sans Mono for ticket furniture.
- Dashed tear rules as the divider language; no boxes, no radius, no shadows.
- Running ticket header and perforated foot on every slide.
- 1-bit two-colour plates numbered FIG. NN.

## Colors

Two papers, one ink in five steps, and a single red that belongs to the human.

### Primary
- **Thermal Ink** (`ink`): headlines, strong text, code, the header rule, and every reverse-printed agent surface. It is the printer's only black.

### Secondary
- **Red Thermal Ink** (`you`): the human. YOU tags, human headings, the human's solid ownership bar in the workflow strip, and text selection. Never decoration, never emphasis for its own sake.

### Neutral
- **Thermal Paper** (`paper`): every slide ground, the light colour of every plate, the text colour of reverse print.
- **Second Ticket** (`paper-2`): the /btw aside ground only, the stock of a second ticket clipped under the first.
- **Faded Ink** (`ink-2`): running lines, subtitles, captions, table cells.
- **Pale Ink** (`ink-3`): secondary furniture; table heads, row numbers, fraction labels, agenda times, code comments, opener subtitles.
- **Ghost Ink** (`ink-4`): tear rules, perforations, list markers, the outline of a SHARED tag. Never text.
- **Paper Shadow** (`ink-5`): the lightest ramp step; reserved, almost unused in the build.

### Named Rules
**The Five-Step Ramp Rule.** The ink ramp is the only grey. No tints, no opacities standing in for colour, except the reveal `semi-out` fragment state (0.35).

**The Red Means You Rule.** Red appears only where the human acted or owns the step. If a red mark cannot be read as "you did this", it is wrong.

**The Ghost Ink Carries No Words Rule.** `ink-4` draws rules and dots; it is too faint to carry text on a projector.

## Typography

**Display Font:** Archivo (variable, wdth 62..125, wght 400..800) with Arial Narrow
**Body Font:** Archivo 400, same family
**Label/Mono Font:** Spline Sans Mono 400/500 with ui-monospace, Menlo

**Character:** a condensed, heavy grotesque shouting the order, regular-width Archivo saying it plainly, and a receipt-printer mono for everything the machine stamps.

### Hierarchy
- **Display** (800, 96px, wdth 75, 0.96): slide headlines. Statement slides step to 112px, section openers 104px, the closing "Fin." 240px; fraction numerals use the same face at 96px.
- **Headline** (800, 64px, wdth 75, 0.96): the default slide headline (`h2`); 76px on statement slides, 52px over plates, 60px over the agenda. Max width 1060px, balanced wrapping.
- **Title** (700, 27px, wdth 85, 1.1): column and line-item heads.
- **Body** (400, 27px, 1.32): subtitles and running lines, max 960px.
- **Body small** (400, 21-23px, 1.32): text inside splits, line items, tables, captions.
- **Label** (Mono 500, 17px, 0.05em, uppercase): the ticket header and the FIRE marker.
- **Label small** (Mono 500, 15-18px, 0.06em, uppercase): YOU/AGENT tags, FIG. numbers, table heads, fraction labels, ladder and strip numbers.
- **Code** (Mono 400, 17px, 1.55): code blocks between two tear rules; inline code at 0.86em in ink.

### Named Rules
**The Two Sizes Rule.** Each slide reads in one display size and one line size; mono furniture does not count. Add a structure, not a third text size.

**The Mono Is Printed Rule.** Spline Sans Mono is for what the ticket printer stamps: header, tags, numbers, figure marks, table heads, code, paths and commands. Argument and prose are never mono.

## Layout

A fixed 1280x720 canvas, no responsive behaviour, no reveal chrome (controls, progress and slide numbers are hidden; transitions are `none`). Content sits left-aligned inside 96px side margins, 132px from the top (under the header) and 64px from the bottom. The header hangs at 40px.

Structures enter about 40px under the headline: two-column splits with 36px gutters either side of a tear, 2-5 column line-item rows (32px column gap, 26px row gap), ladders (56px number column, 14px rows), a 9-step workflow strip, a four-part fraction band, agenda rows with a 96px time column. The foot line pins to the bottom at 50px from the edge; plate captions at 48px.

Section openers drop the headline to sit 150px off the bottom with the subtitle under it, leaving the upper ticket blank. Statement slides push the headline down 110-120px into the upper third.

### Named Rules
**The Blank Stock Rule.** Section openers stay mostly empty paper; never fill the top half.

**The Staircase Is Opt-In Rule.** Ladders are flush by default; the 56px-per-step indent applies only to a ladder explicitly marked as a staircase.

## Elevation & Depth

The deck is flat. There are no drop shadows, no blur, no layered cards. Depth comes from print only: reverse-printed ink bars sit "heavier" than paper, and the /btw aside is a second ticket on darker stock (`paper-2`) with a 22px strip of the first ticket's paper and a 2px dashed tear showing above it. The only `box-shadow` in the build is an inset hairline used as an outline (tags, FIRE marker), never an offset.

### Named Rules
**The Print Has No Lift Rule.** Nothing floats. If something needs weight, reverse-print it; if something is an aside, put it on the second ticket.

## Shapes

Square corners everywhere (0px). The form language is the ticket: a dashed header rule (3px, ink), dashed tear rules (2px, ghost ink) between rows, columns and code, a perforated bottom edge drawn as a row of half-dots (5px radius, 16px pitch, ghost ink), and rectangular outline or reverse-print stamps. Plates are unframed rectangles of 1-bit print.

### Named Rules
**The Tear Rule.** Dividers are dashed. Two weights: 3px ink for the header and the top of a table or fraction band, 2px ghost ink for everything between. A solid 3px top bar exists only as an ownership mark (red for you, ink for the agent) in the workflow strip, never as a divider.

## Components

### Ticket Header
The running header on every leaf slide, built by script: `ORDER #NNN` left (with `· /btw` on asides), running section centre (ellipsised), a right-hand clock cell, and a FIRE marker on live slides. Label type, uppercase, over a 3px dashed ink rule. Decorative to assistive tech (`aria-hidden`).

### Ownership Tags
- **YOU:** red label-small text inside a 1.5px red inset outline.
- **AGENT:** paper text on an ink block (reverse print).
- **SHARED / both:** pale ink text inside a ghost-ink outline.
- Headings follow the same law: a human heading turns red; an agent heading becomes a reverse-printed bar (3px 9px 4px padding).

### FIRE Marker
The live-demo stamp in the header: the word FIRE in label type inside a 2px inset ink outline. Outline, never filled; it marks a slide where the terminal takes over.

### Line Items and Splits
Columns separated by vertical tear rules; line items topped by a tear rule with 16px above their title. No backgrounds, no boxes.

### Fraction Band
A full-width row of big condensed numerals with mono labels, bounded by a 3px dashed ink top and a tear bottom; the agent's share is a reverse-printed cell.

### Tables
Mono uppercase heads in pale ink over a 3px dashed ink rule, rows on tear rules, first column bold ink and unwrapped, no zebra, no fills.

### /btw Ticket
Vertical asides are a second ticket: `paper-2` ground, a paper strip with a dashed tear across the top, header shifted down 10px. Asides that carry a plate stay on `paper` so the plate's paper matches the ground.

### Plates
Memes are 1-bit, two-colour PNGs (palette exactly ink and paper) with generation provenance embedded in a text chunk. Each is exported at its on-slide height (356px default; 400px tall; 410px raised) and rendered with `image-rendering: pixelated` so pixels map 1:1. Centered, unframed, numbered `FIG. NN` in mono ahead of the caption, counting through the deck.

### Foot Line
The slide's closing sentence pinned to the bottom margin in body type (ink, 27px), often revealed as a fragment. A mono variant (17px, pale ink) carries literal references only: paths, map links, commands.

## Do's and Don'ts

### Do:
- **Do** keep every slide on `paper` (#fbfaf6) with the running ticket header and the perforated foot.
- **Do** mark ownership with red ink for the human and reverse print for the agent, and nothing else.
- **Do** separate with dashed tear rules: 3px ink at the head of a block, 2px ghost ink between.
- **Do** set headlines in Archivo 800 at 75% width, 0.96 leading, -0.015em tracking.
- **Do** export plates as 1-bit ink+paper at their exact on-slide height, render them pixelated, and number them FIG. NN.
- **Do** put /btw asides on `paper-2` with the paper strip above, except plate asides, which stay on `paper`.

### Don't:
- **Don't** draw boxed tiles, cards, rounded corners, or offset shadows; the ticket has no containers.
- **Don't** use solid rules as dividers; solid bars are ownership marks only.
- **Don't** put eyebrow labels or section numbers above headlines; location lives in the ticket header.
- **Don't** introduce a grey, tint, or accent outside the five-step ink ramp and the one red.
- **Don't** set prose, slogans, or category labels in mono.
- **Don't** show grid-paper or other background chrome.
