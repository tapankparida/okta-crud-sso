const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function request(path, accessToken, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function getProducts(accessToken) {
  return request('/products', accessToken);
}

export function createProduct(accessToken, product) {
  return request('/products', accessToken, {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

export function updateProduct(accessToken, id, product) {
  return request(`/products/${id}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(product)
  });
}

export function deleteProduct(accessToken, id) {
  return request(`/products/${id}`, accessToken, {
    method: 'DELETE'
  });
}

export function getProfile(accessToken) {
  return request('/products/me', accessToken);
}
