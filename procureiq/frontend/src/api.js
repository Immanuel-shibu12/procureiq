// Small fetch wrapper: adds the JWT and throws readable errors
export async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') },
    body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const STATUS_COLOR = { draft: 'secondary', submitted: 'info', under_review: 'warning', approved: 'success', rejected: 'danger', ordered: 'primary', delivered: 'dark', active: 'success', inactive: 'secondary', under_review_s: 'warning', suspended: 'danger' };
export const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
