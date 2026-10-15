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
| `assets/` | Logos (`logo-header.png` is the one in the menu bar) and browser-tab icon |

## Settings (top of `app.js`)

- `SHEET_URL`: the published sheet link (up to `/pub`)
- `SHEET_TABS`: gid numbers of the Catalogue and Offers tabs, any order
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
Delivery, Availability, Featured, Photo 1, Photo 2, Photo 3, Video, Description,
Show on Website, New Arrival, Sale Price, Occasion, Home Collection.
Headings are matched loosely (capitals, spaces and dashes do not matter), and the
older names (id, name, collection, fabric_group, image_url...) still work.

The main menu (and the Shop links in the footer) is built from the Category column,
in the order categories first appear in the sheet. A new category, e.g. Dupatta,
gets its own menu item "Dupattas" automatically; a category with no products on the
website drops out of the menu. Saree, Salwar, Kurti, Lehenga and Cord-set keep their
usual names (Sarees, Salwar Suits, Kurtis & Gowns...). Availability "Hidden" keeps a
row off the website.

Colours: a number (6) or colour names (Red, Blue, Green). Up to 3 colours: "Available
in 3 colours" / "Available in Red, Blue and Green". More than 3: the card says "More
colours" and the product window asks customers to message on Instagram or WhatsApp
to see all the colours (with names, only the first 3 are shown).

Show on Website (tick-box): once at least one row is ticked, only ticked rows
appear on the site. With the column missing or nothing ticked, every row shows.
New Arrival (tick-box): adds a "New arrival" label, a New arrivals filter, and
puts the product near the top (after Featured). Yes/TRUE/1/x all count as ticked.

Sale Price (optional): if lower than Price, the site shows it with Price crossed
out, a "% off" note, a Sale label and an On sale filter.

## Offers banner (Offers tab)

Columns: Show, Headline, Details, Button Text, Button Link, Start Date, End Date,
Colour. A row shows as a banner under the header on every page when Show = Yes
and today is within the dates (empty dates = no limit). Several live rows rotate.
Button Link: a category name, WhatsApp, Instagram (opens a DM), Instagram page, a product code, or a full URL.
Colour: Red, Pink, Teal, Gold, Brown, or a #hex value.

## Featured carousel and paging

The carousel above the catalogue follows the selected category: its Featured
products first, then its New Arrivals. It hides when the category has neither.
The catalogue shows 20 products, then 10 more each time "Show more" is pressed;
any filter, sort, search or category change starts again at 20.

## Occasions

Occasion column: Daily Wear, Work Wear, Party Wear, Celebrity Inspired, Traditional
Wear, Wedding Wear (several allowed, comma separated). Each category shows a row of
occasion circles with counts above its products, plus an Occasion filter. Links can
open on an occasion: `index.html?cat=Saree&occasion=Wedding Wear`.
Each circle shows Photo 1 of a product from that category and occasion (Featured, then
New Arrival, then any with a photo; each circle tries to use a different product).
Nothing to maintain: an occasion with no photos yet shows its coloured icon instead.

## Collage carousel (top of home page)

If any product has a Home Collection name, each name becomes one slide with up to
four of its products (Featured, New Arrival and products with photos first), and
its button shows just that collection. With Home Collection empty, the five biggest
sub-categories are used automatically.
