var dataGlobal = {};
function normalizePhoneNumber(number) {
    if (!number) return '';
    let cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
    } else if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
    }
    return cleaned;
}

function isValidEmail(email) {
    if (!email) return false;
    const lower = email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(lower);
}

function toProperCase(name) {
    return name
    .toLowerCase()
    .split(' ')
    .filter(word => word.trim() !== '')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function fetchAndExtractUserData() {
    const urls = [
        'https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/course.json',
        'https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json'
    ];

    const results = [];

    for (const url of urls) {
    try {
        const response = await axios.get(url);
        const data = response.data;

        _.forEach(data?.['data-engineering-fundamental']?.['sesi-1'], (sesiItem) => {
        const processEntry = (entry) => {
            const email = (entry.email || '').toLowerCase();
            const name = toProperCase(entry.fullName || '');
            const whatsapp = normalizePhoneNumber(entry.whatsapp);

            if (name && isValidEmail(email) && whatsapp) {
            results.push({
                name,
                email,
                whatsapp
            });
            }
        };

        if (sesiItem?.email && sesiItem?.fullName && sesiItem?.whatsapp) {
            processEntry(sesiItem);
        } else {
            _.forEach(sesiItem, (subItem) => {
            if (_.isPlainObject(subItem) && subItem.form === 1) {
                processEntry(subItem);
            }
            });
        }
        });

    } catch (error) {
        console.error(`Gagal mengambil data dari ${url}:`, error);
    }
    }
    return results;
}

function setCookie(name, value, seconds) {
    const expires = new Date(Date.now() + seconds * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

$(document).ready(function () {
    fetchAndExtractUserData().then(data => {
        dataGlobal = data;
        // Modal login logic
        if (getCookie('user_auth')) {
            window.location.href = './dashboard';
            return;
        }
        $('#form-container').addClass('hidden');
        $('#login-modal').removeClass('hidden');

        $('#login-form').on('submit', function (e) {
            e.preventDefault();
            const email = ($('#login-email').val() || '').toLowerCase().trim();
            const wa = normalizePhoneNumber($('#login-wa').val());
            const found = dataGlobal.find(item =>
                item.email === email && normalizePhoneNumber(item.whatsapp) === wa
            );
            if (found) {
                setCookie('user_auth', email + '|' + wa, 600);
                window.location.href = './dashboard';
            } else {
                alert('Tidak ada data yang cocok silahkan melakukan pengisian form dahulu');
                $('#login-modal').addClass('hidden');
                $('#form-container').removeClass('hidden');
            }
        });
    });
});