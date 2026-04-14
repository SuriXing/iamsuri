import { products } from '../../data/products';
import './ProductRoom.css';

// Emoji glyphs for the 2D card icon. Canonical Product shape drops the
// legacy hard-coded icon, so we resolve it by slug here. Cheap and local.
const PRODUCT_ICONS: Record<string, string> = {
  'problem-solver': '💡',
  'mentor-table': '⭐',
};

export default function ProductRoom() {
  return (
    <div className="product-room">
      <div className="product-room__grid">
        {products.map(product => (
          <a
            key={product.slug}
            className="product-card"
            href={product.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="product-card__accent" />
            <div className="product-card__icon">{PRODUCT_ICONS[product.slug] ?? '🚀'}</div>
            <h3 className="product-card__name">{product.title}</h3>
            <p className="product-card__desc">{product.excerpt}</p>
            <div className="product-card__footer">
              <div className="product-card__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="product-card__tag">{tag}</span>
                ))}
              </div>
              {product.status === 'shipped' && (
                <span className="product-card__status">● Live</span>
              )}
            </div>
          </a>
        ))}

        {/* Coming soon stands */}
        <div className="product-card product-card--empty">
          <div className="product-card__icon" style={{ opacity: 0.3 }}>📦</div>
          <p className="product-card__desc">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
