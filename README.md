# Tarasvini Catalogue

Static website for Tarasvini, published by Netlify from this repo.
Products come live from the published Google Sheet (Catalogue tab).

## Files

| File | What it is |
|---|---|
| `index.html` | Catalogue home page |
| `about.html`, `reviews.html`, `contact.html` | Other pages |
| `style.css` | Look of every page (colours, fonts, layout) |
| `app.js` | Everything the site does. **Settings are at the top.** |
| `catalogue-backup.csv` | Saved copy of the products, shown only if Google Sheets cannot be reached |
| `assets/` | Logo and browser-tab icon |

## Settings (top of `app.js`)

- `CSV_URL`: published CSV link of the Catalogue tab
- `REVIEWS_URL`: published CSV link of the Reviews sheet
- `WA`: WhatsApp number with country code, no `+`

## Updating products

Edit the Google Sheet. The website picks up changes within a few minutes
(Google refreshes published sheets about every 5 minutes). No upload needed.

Now and then, refresh the backup: in Google Sheets open the Catalogue tab,
File > Download > CSV, rename the file to `catalogue-backup.csv` and upload
it here, replacing the old one.

## Sheet columns the site reads

Product Code, Category, Sub-category, Product Name, Fabric, Colours, Sizes, Price,
Delivery, Availability, Featured, Photo 1, Photo 2, Photo 3, Video, Description.
Headings are matched loosely (capitals, spaces and dashes do not matter), and the
older names (id, name, collection, fabric_group, image_url...) still work.

Category values become the website tabs: Saree, Salwar, Kurti, Lehenga, Cord-set.
A tab only appears once it has at least one product. Availability "Hidden"
keeps a row off the website.
