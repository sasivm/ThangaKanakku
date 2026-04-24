# ThangaKanakku

Thanga Kanakku is a mobile-first gold jewellery price calculator built with Angular, Angular Material, and Capacitor. It helps estimate a fair jewellery price from weight, gold rate, wastage, making charge, and GST, then compares that estimate with a shopkeeper's quoted price.

The app title also appears in Tamil in the UI as `Thanga Kanakku`.

## Features

- Gold price calculation from gross weight and gold rate.
- Wastage input as either a percentage of gross weight or direct grams.
- Making charge input as either fixed rupees per gram or percentage of gold value.
- Optional 3% GST calculation on gold, wastage, and making charge.
- Price breakup with formulas for gold cost, wastage cost, making charge, subtotal, GST, and final price.
- Bargain comparison against a quoted shop price.
- Overpaying/saving indicator, implied making charge, and negotiation tip.
- Responsive, mobile-sized UI using Angular Material tabs, form fields, slide toggle, and ripple interactions.
- Capacitor Android project configured with app id `com.thangakanakku.app`.

## Tech Stack

- Angular 21
- Angular Material 21
- Reactive Forms
- TypeScript
- SCSS
- Vitest through Angular's unit-test builder
- Capacitor 8 with Android platform support

## Project Structure

```text
src/
  app/
    app.ts          Main calculator and bargain logic
    app.html        Angular Material tabbed UI
    app.scss        Component-level gold themed layout
    app-module.ts   Angular module and Material imports
  styles.scss       Global Material theme and CSS variables
  material-theme.scss
android/            Capacitor Android project
capacitor.config.ts Capacitor app id, name, and web output path
```

## Prerequisites

- Node.js with npm
- Angular CLI, or use npm scripts from this project
- Android Studio and Android SDK for Android builds

Install dependencies:

```bash
npm install
```

## Web Development

Start the local development server:

```bash
npm start
```

Open `http://localhost:4200/`. The app reloads automatically when source files change.

Build the web app:

```bash
npm run build
```

Watch-build during development:

```bash
npm run watch
```

Run unit tests:

```bash
npm test
```

## Android Development

The Capacitor config uses:

- `appId`: `com.thangakanakku.app`
- `appName`: `ThangaKanakku`
- `webDir`: `dist/ThangaKanakku/browser`

Build the Angular app before syncing Android:

```bash
npm run build
npx cap sync android
```

Open the Android project:

```bash
npx cap open android
```

From Android Studio, run the app on an emulator or connected Android device.

## Calculation Notes

The calculator uses these formulas:

```text
gold value = gross weight * gold rate
wastage grams = gross weight * wastage percent / 100
wastage cost = wastage grams * gold rate
total grams = gross weight + wastage grams
fixed making charge = total grams * making charge per gram
percent making charge = gold value * making percent / 100
subtotal = gold value + wastage cost + making charge
gst = subtotal * 3 / 100
final price = subtotal + gst
```

When GST is disabled, `gst` is treated as `0` and the final price equals the subtotal.

The bargain tab compares the shop price with the calculated fair price and derives the implied making charge as:

```text
implied making charge = shop price - gold value - wastage cost
```

## Notes

This project is a calculation helper. Jewellery pricing can vary by purity, stone weight, discounts, store policies, hallmarking charges, offers, and local billing practices, so confirm final pricing with the seller before purchase.
