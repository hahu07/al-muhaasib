# Theme Toggle Test Instructions

## What Should Happen

When you click the theme toggle button (sun/moon icon in the top-right corner):

1. **Dark Mode (default)**:
   - Background: Black
   - Text: Blue (#93C5FD)
   - Button shows: Sun icon ☀️
   - Click to switch to light mode

2. **Light Mode**:
   - Background: White
   - Text: Dark gray (#111827)
   - Button shows: Moon icon 🌙
   - Click to switch back to dark mode

## How to Test

### Option 1: Development Server

```bash
npm run dev
```

Then open `http://localhost:3000` (or the port shown) in your browser.

### Option 2: Production Build (Recommended)

```bash
# Build is already done, just serve the files
python3 -m http.server --directory out 8080
```

Then open `http://localhost:8080` in your browser.

## Debugging

If the theme toggle still doesn't work, open browser DevTools (F12) and:

1. Go to **Console** tab
2. Type this and press Enter:

   ```javascript
   document.documentElement.className;
   ```

   You should see either "dark" or "light"

3. Click the theme toggle button
4. Run the command again - the class should change

5. Check if CSS variables are being applied:
   ```javascript
   getComputedStyle(document.body).backgroundColor;
   ```

   - Dark mode: should be "rgb(0, 0, 0)"
   - Light mode: should be "rgb(255, 255, 255)"

## Manual Test

If automatic toggle doesn't work, try manually in the browser console:

```javascript
// Switch to light mode
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");

// Switch to dark mode
document.documentElement.classList.remove("light");
document.documentElement.classList.add("dark");
```

If this works but the button doesn't, it's a JavaScript/React issue.
If this doesn't work, it's a CSS issue.
