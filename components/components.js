/**
 * 공통 컴포넌트 로드 함수
 * Vanilla JS를 사용하여 헤더와 푸터를 동적으로 로드합니다.
 */

// 헤더 로드
async function loadHeader() {
    try {
        const response = await fetch('components/header.html');
        if (!response.ok) {
            throw new Error('헤더를 불러올 수 없습니다.');
        }
        const html = await response.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = html;
            
            // Lucide Icons 재생성
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // 모바일 메뉴 함수 초기화
            initMobileMenu();
            
            // 네비게이션 스크롤 효과 초기화
            initNavbarScroll();
        }
    } catch (error) {
        console.error('헤더 로드 실패:', error);
    }
}

// 푸터 로드
async function loadFooter() {
    try {
        const response = await fetch('components/footer.html');
        if (!response.ok) {
            throw new Error('푸터를 불러올 수 없습니다.');
        }
        const html = await response.text();
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = html;
            
            // Lucide Icons 재생성
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('푸터 로드 실패:', error);
    }
}

// 모바일 메뉴 초기화
function initMobileMenu() {
    // 모바일 메뉴 토글 함수는 전역으로 정의되어 있어야 함
    if (typeof toggleMobileMenu === 'undefined') {
        window.toggleMobileMenu = function() {
            const mobileMenu = document.getElementById('mobile-menu');
            const menuBtn = document.getElementById('mobileMenuBtn');
            
            if (mobileMenu) {
                const isHidden = mobileMenu.classList.contains('hidden');
                
                if (isHidden) {
                    mobileMenu.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                    // 아이콘 변경 (menu -> x)
                    if (menuBtn) {
                        const icon = menuBtn.querySelector('i');
                        if (icon) {
                            icon.setAttribute('data-lucide', 'x');
                            if (typeof lucide !== 'undefined') {
                                lucide.createIcons();
                            }
                        }
                    }
                } else {
                    closeMobileMenu();
                }
            }
        };
    }
    
    if (typeof closeMobileMenu === 'undefined') {
        window.closeMobileMenu = function() {
            const mobileMenu = document.getElementById('mobile-menu');
            const menuBtn = document.getElementById('mobileMenuBtn');
            
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
                // 아이콘 변경 (x -> menu)
                if (menuBtn) {
                    const icon = menuBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                }
            }
        };
    }
}

// 네비게이션 스크롤 효과
function initNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-lg');
            } else {
                navbar.classList.remove('shadow-lg');
            }
        }
    });
}

// 테마 전환
window.toggleTheme = function() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('nexo-theme', next);
};

// 네비게이션 카드 로드
async function loadNavCards() {
    try {
        const response = await fetch('components/nav-cards.html');
        if (!response.ok) return;
        const html = await response.text();
        const placeholder = document.getElementById('nav-cards-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('네비게이션 카드 로드 실패:', error);
    }
}

// 모든 컴포넌트 로드
async function loadComponents() {
    await Promise.all([
        loadHeader(),
        loadFooter(),
        loadNavCards()
    ]);
}

// DOM 로드 완료 시 컴포넌트 로드
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
} else {
    loadComponents();
}

