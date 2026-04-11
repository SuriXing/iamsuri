import { products } from '../../data/products';
import './ProductRoom.css';

export default function ProductRoom() {
  return (
    <div className="product-room">
      <div className="product-room__grid">
        {products.map(product => (
          <a
            key={product.id}
            className="product-card"
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="product-card__accent" />
            <div className="product-card__icon">{product.icon}</div>
            <h3 className="product-card__name">{product.name}</h3>
            <p className="product-card__desc">{product.description}</p>
            <div className="product-card__footer">
              <div className="product-card__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="product-card__tag">{tag}</span>
                ))}
              </div>
              {product.status === 'live' && (
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
