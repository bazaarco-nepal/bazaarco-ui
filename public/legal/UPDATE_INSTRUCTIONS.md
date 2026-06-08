# How to Update Legal Documents

This guide explains how to update BazaarCo legal documents without touching any code.

## Quick Start

1. Open any `.json` file in this folder
2. Edit the `content` field
3. Update the `version` and `lastUpdated` fields
4. Save the file
5. The changes go live (within minutes, after cache clears)

## Files You Can Edit

All files in this folder are safe to edit:
- `terms-and-conditions.json`
- `privacy-policy.json`
- `seller-agreement.json`
- `return-and-refund-policy.json`
- `cancellation-policy.json`
- `shipping-and-delivery-policy.json`
- `prohibited-products-policy.json`
- `cookie-tracking-notice.json`
- `reviews-and-guidelines.json`
- `grievance-redressal-policy.json`

## Step-by-Step Instructions

### 1. Which File to Edit?

See `README.md` for a full list of documents and what they cover.

### 2. Open the File

Use any text editor:
- VS Code
- Notepad
- Google Docs (copy to JSON)
- Any JSON editor

### 3. Edit the Content

```json
{
  "slug": "terms-and-conditions",
  "title": "BazaarCo Terms & Conditions",
  "version": "1.0",
  "effectiveDate": "2026-06-08",
  "lastUpdated": "2026-06-08",
  "content": "Edit this part..."
}
```

**Important:** The `content` field uses `\n` for line breaks, so:
- Type normally in your editor
- Use actual line breaks (press Enter)
- Or use `\n` explicitly if hand-editing JSON

### 4. Update Version & Date

When you make changes:

**If it's a typo or small fix:**
- Leave `version` the same
- Update `lastUpdated` to today's date

**If it's a significant change:**
- Increment `version`: 1.0 → 1.1 (for clarifications) or 1.0 → 2.0 (for new terms)
- Update `lastUpdated` to today's date

### 5. Save & Publish

1. Save the file
2. Changes appear on the website within 5-10 minutes
3. If testing locally, hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Version Strategy

- **Same version (1.0 → 1.0):** Typos, formatting, clarifications that don't change obligations
- **Patch bump (1.0 → 1.1):** Small clarifications or policy improvements
- **Minor bump (1.0 → 2.0):** New terms or obligations added
- **Major bump (1.0 → 3.0):** Significant rewrite or legal restructuring

**Rule:** If users' obligations change, bump the version. They'll be asked to re-accept.

## Content Tips

### Line Breaks
The content uses `\n` for line breaks. When displayed on the website:
- Blank lines create visual spacing
- The component auto-formats with proper headings, bullets, etc.

### Structure
Follow this pattern:
```
TITLE HERE

1. SECTION NAME

Content here...

• Bullet point
• Another bullet

2. NEXT SECTION

More content...
```

### Placeholders
Keep `[BRACKETED]` placeholders as-is. They're replaced at runtime or filled in before publishing:
- `[SUPPORT EMAIL]`
- `[SUPPORT PHONE]`
- `[OCR NO.]`
- etc.

### Don't Include
- HTML tags
- Markdown syntax
- Special formatting (keep it plain text)

## FAQ

**Q: How often can I update documents?**
A: Anytime. No limit. Changes go live within minutes.

**Q: Do I need to tell users about updates?**
A: Only if it's a significant change (version bump). The system tracks when policies change and asks users to re-accept.

**Q: Can I delete a document?**
A: No, don't delete files. Hide it by setting `"active": false` in the JSON if you need to (contact engineering for this).

**Q: What if I mess up the JSON?**
A: The website will show an error message. Just fix the file and it'll work again. The previous version isn't lost—revert to the last saved state if needed.

**Q: Can I add images or links?**
A: Keep it plain text. If you need custom formatting, contact the engineering team to update the display component.

**Q: How long until changes appear?**
A: Immediately in development; 5-10 minutes in production (CDN cache). Hard refresh your browser to see changes faster while testing.

## Getting Help

If you have questions:
1. Check the `README.md` for more details
2. Look at existing `.json` files for examples
3. Contact engineering if you need help with formatting or want to add new features

---

**Remember:** These files are your source of truth. Keep them up to date and accurate. The law firm reviewing your policies should be reviewing these JSON files, not code.
