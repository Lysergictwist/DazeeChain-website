#!/bin/bash

# Create common CSS and JS directories if they don't exist
mkdir -p css js

# Fix all HTML files to use the common CSS and JS
find . -name "*.html" -type f -exec sed -i '' 's|<script src="js/common.js"></script>|<script src="js/wallet.js"></script>\n    <script src="js/wallet-connect.js"></script>\n    <script src="js/menu.js"></script>|g' {} \;

echo "All pages have been updated to use the common CSS and JS files."
