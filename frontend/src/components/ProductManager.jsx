import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  getProfile,
  updateProduct
} from '../services/api.js';

const emptyProduct = {
  name: '',
  description: '',
  price: ''
};

export default function ProductManager() {
  const { authState, oktaAuth } = useOktaAuth();
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const accessToken = authState?.accessToken?.accessToken;
  const displayName = useMemo(
    () => profile?.name || profile?.email || authState?.idToken?.claims?.email || 'Signed-in user',
    [authState, profile]
  );

  const loadProducts = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [productList, userProfile] = await Promise.all([
        getProducts(accessToken),
        getProfile(accessToken)
      ]);
      setProducts(productList);
      setProfile(userProfile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function submitProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      price: Number(form.price)
    };

    try {
      if (editingId) {
        await updateProduct(accessToken, editingId, payload);
      } else {
        await createProduct(accessToken, payload);
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(id) {
    setError('');

    try {
      await deleteProduct(accessToken, id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Protected workspace</p>
          <h1>Products</h1>
        </div>
        <div className="user-actions">
          <span>{displayName}</span>
          <button type="button" onClick={() => oktaAuth.signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="workspace">
        <form className="product-form" onSubmit={submitProduct}>
          <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          <label>
            Name
            <input name="name" value={form.name} onChange={updateField} required maxLength={120} />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={updateField} maxLength={500} />
          </label>
          <label>
            Price
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={updateField}
              min="0"
              step="0.01"
              required
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="product-list" aria-live="polite">
          <div className="list-header">
            <h2>Inventory</h2>
            <button type="button" onClick={loadProducts}>
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="muted">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="muted">No products yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.description || '-'}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => editProduct(product)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeProduct(product.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
