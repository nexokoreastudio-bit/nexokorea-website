function isLocalQuoteTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const forceLiveSubmit = urlParams.get('liveSubmit') === 'true';

    if (forceLiveSubmit) {
        return false;
    }

    return (
        urlParams.get('test') === 'true' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );
}

function getQuoteEndpoint() {
    if (typeof window.NEXO_QUOTE_ENDPOINT === 'string') {
        return window.NEXO_QUOTE_ENDPOINT.trim();
    }
    return '';
}

function buildQuotePayload(form) {
    const formData = new FormData(form);
    const payload = {};

    for (const [key, value] of formData.entries()) {
        payload[key] = value;
    }

    payload.source_page = window.location.pathname || '/';
    payload.page_url = window.location.href;
    payload.submitted_at = new Date().toISOString();

    return payload;
}

function submitToNetlify(form) {
    return new Promise((resolve, reject) => {
        const iframeName = `netlify-submit-frame-${Date.now()}`;
        const iframe = document.createElement('iframe');
        iframe.name = iframeName;
        iframe.style.display = 'none';

        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = window.location.pathname || '/';
        tempForm.target = iframeName;
        tempForm.setAttribute('data-netlify', 'true');
        tempForm.style.display = 'none';

        const sourceData = new FormData(form);
        const pairs = [['form-name', form.getAttribute('name') || '견적문의']];

        for (const [key, value] of sourceData.entries()) {
            pairs.push([key, value]);
        }

        let settled = false;

        const cleanup = () => {
            setTimeout(() => {
                iframe.remove();
                tempForm.remove();
            }, 300);
        };

        const finish = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve();
        };

        iframe.addEventListener('load', finish, { once: true });

        setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(new Error('Netlify 폼 제출 시간이 초과되었습니다.'));
        }, 10000);

        for (const [name, value] of pairs) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            tempForm.appendChild(input);
        }

        document.body.appendChild(iframe);
        document.body.appendChild(tempForm);
        tempForm.submit();
    });
}

async function submitQuoteForm(event, options = {}) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    const endpoint = getQuoteEndpoint();
    const isLocalTestMode = isLocalQuoteTestMode();

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="animate-spin">⏳</span> 전송 중...';

    try {
        if (isLocalTestMode) {
            const payload = buildQuotePayload(form);
            await new Promise((resolve) => setTimeout(resolve, 800));
            console.log('=== 로컬 테스트 모드: 견적문의 데이터 ===');
            console.log(payload);
            console.log('=====================================');

            if (typeof options.onSuccess === 'function') {
                options.onSuccess();
            }

            form.reset();
            return false;
        }

        await submitToNetlify(form);

        if (endpoint) {
            const payload = buildQuotePayload(form);

            // Apps Script 웹앱은 no-cors + text/plain 조합이 가장 안정적입니다.
            await fetch(endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            });
        }

        if (typeof options.onSuccess === 'function') {
            options.onSuccess();
        }

        form.reset();
        return false;
    } catch (error) {
        console.error('Quote form submission error:', error);
        alert('문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return false;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}
