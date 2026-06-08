# Legal Documents Management

This folder contains all legal documents for BazaarCo in **Markdown format**. These files are served directly to users and can be updated without touching any code.

## 📁 File Structure

```
public/legal/
├── README.md (this file)
├── terms-and-conditions.md
├── privacy-policy.md
├── seller-agreement.md
├── return-and-refund-policy.md
├── cancellation-policy.md
├── shipping-and-delivery-policy.md
├── prohibited-products-policy.md
├── cookie-tracking-notice.md
├── reviews-and-guidelines.md
└── grievance-redressal-policy.md
```

## 🚀 How to Update a Legal Document

### Super Simple - Just Edit the File!

1. **Open any `.md` file** in this folder (e.g., `terms-and-conditions.md`)
2. **Edit directly** - It's plain Markdown, human-readable
3. **Save** - Done! Changes go live in 5-10 minutes

### That's it. No JSON parsing. No code. Just edit and save.

## 📝 Markdown File Structure

Each legal document uses simple Markdown:

```markdown
# Document Title

**Version:** 1.0  
**Effective Date:** [TO BE FILLED]  
**Last Updated:** [TO BE FILLED]

## 1. Section Name

Content here...

- Bullet point
- Another bullet

### Subsection

More content...
```

### What You Get Automatically

- **Title** extracted from the first `# Heading`
- **Slug** from the filename (e.g., `terms-and-conditions.md` → `/legal/terms-and-conditions`)
- **Beautiful formatting** - Headings, lists, bold, links all rendered properly
- **Responsive design** - Looks great on all devices

## 🔗 How These Are Used in the App

### 1. Public Pages
Every document has its own public route:
```
/legal/terms-and-conditions
/legal/privacy-policy
/legal/seller-agreement
/legal/return-and-refund-policy
/legal/cancellation-policy
/legal/shipping-and-delivery-policy
/legal/prohibited-products-policy
/legal/cookie-tracking-notice
/legal/reviews-and-guidelines
/legal/grievance-redressal-policy
```

Routes are **automatically generated** - no hardcoding needed.

### 2. Footer Links
Link to any document from the footer - all 10 links in one place.

### 3. Signup/Checkout Modals
Users accept T&C at signup and checkout. The content is fetched from the Markdown file.

### 4. Settings Page
Users can view and re-accept policies from their account settings.

## 🎯 Best Practices

### Editing Tips
- Use standard Markdown: `# Heading`, `## Subheading`, `- bullet`, `**bold**`
- Keep it simple and readable
- No HTML needed - pure Markdown
- Line breaks and spacing matter for readability

### Placeholders
Some files have `[BRACKETED]` placeholders:
- `[SUPPORT EMAIL]`
- `[SUPPORT PHONE]`
- `[REGISTERED ADDRESS]`
- `[OCR NO.]`
- `[TO BE FILLED]`

**Fill these before publishing** - they're your company details.

### Version Tracking
- **Header:** Shows "Version: 1.0", "Effective Date", "Last Updated"
- **Update when:** Significant content changes
- **Format:** Just edit the header markdown

### Performance
- Markdown files are cached by browser
- Changes propagate within 5-10 minutes
- No build/deploy needed
- No code changes required

## 📋 Checklist Before Updating

- [ ] Have the change reviewed/approved by management
- [ ] Update the JSON file
- [ ] Increment version number if needed
- [ ] Update `lastUpdated` to today's date
- [ ] Test the page displays correctly
- [ ] Clear browser cache (if testing locally)
- [ ] Notify users if major changes (email, in-app notification)

## 🔍 Testing Changes Locally

1. Edit a `.json` file
2. Start the dev server: `npm run dev`
3. Visit `http://localhost:3000/legal/[slug]`
4. Changes should reflect immediately

If they don't:
- Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
- Clear `.next` build cache: `rm -rf .next`
- Restart dev server

## 📞 Questions?

If a legal document needs updating but you're unsure about the format:
1. Check the existing `.json` files as examples
2. Keep it simple - plain text with line breaks works fine
3. Contact the engineering team if you need HTML formatting

---

**Last Updated:** June 8, 2026
