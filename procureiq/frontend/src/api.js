// Determines backend base URL for Web Browser vs Native Mobile Capacitor
export const getBaseUrl = () => {
  // 1. Custom configured server URL from user settings
  const custom = localStorage.getItem('mediprocure_backend_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/$/, '') + '/api';
  }

  // 2. Check if running inside Capacitor native mobile container
  const isCapacitor = typeof window !== 'undefined' && (
    window.Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );

  if (isCapacitor) {
    // Default to Android Emulator loopback host, or Wi-Fi LAN IP if configured
    return 'http://10.0.2.2:5000/api';
  }

  // 3. Web browser environment (Vite proxy forwards /api to backend)
  return '/api';
};

// Fetch wrapper: handles relative & mobile absolute paths, JWT auth, and errors
export async function api(path, method = 'GET', body) {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const STATUS_COLOR = {
  draft: 'secondary',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  ordered: 'primary',
  delivered: 'dark',
  active: 'success',
  inactive: 'secondary',
  under_review_s: 'warning',
  suspended: 'danger'
};

export const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
