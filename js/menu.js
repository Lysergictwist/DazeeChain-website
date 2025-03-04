// Common menu functionality for DazeeChain Website
console.log('Menu.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Desktop dropdown menu
    const menuToggle = document.getElementById('userMenuToggle');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    console.log('Menu toggle:', menuToggle);
    console.log('Dropdown menu:', dropdownMenu);
    
    if (menuToggle && dropdownMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu clicked');
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const closeMenuBtn = document.getElementById('closeMenuButton');

    if (mobileMenuBtn && mobileMenu && menuBackdrop && closeMenuBtn) {
        function openMobileMenu() {
            mobileMenu.classList.add('show');
            menuBackdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileMenu() {
            mobileMenu.classList.remove('show');
            menuBackdrop.classList.remove('show');
            document.body.style.overflow = '';
        }

        mobileMenuBtn.addEventListener('click', openMobileMenu);
        closeMenuBtn.addEventListener('click', closeMobileMenu);
        menuBackdrop.addEventListener('click', closeMobileMenu);

        // Close menu when clicking links
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }
});
