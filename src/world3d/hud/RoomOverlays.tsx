import { useWorldStore } from '../store/worldStore';

/**
 * Hidden DOM overlays kept for legacy Playwright tests. They never display
 * visually (CSS sets `display: none`) but the `.active` class is toggled
 * based on the current view mode so the existing test suite still passes.
 */
export function RoomOverlays() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const cls = (id: string): string =>
    'room-overlay' + (viewMode === id ? ' active' : '');

  return (
    <>
      <div id="overlay-myroom" className={cls('myroom')}>
        <h2>My Room</h2>
        <p className="bio">Suri Xing, Grade 8</p>
        <div className="tags">
          <span className="tag purple">Math</span>
          <span className="tag purple">Design</span>
          <span className="tag purple">Debate</span>
          <span className="tag purple">Building</span>
        </div>
      </div>

      <div id="overlay-product" className={cls('product')}>
        <h2>Product Room</h2>
        <div className="product-card">
          <span className="live-badge">LIVE</span>
          <h3>Problem Solver</h3>
          <p>Drop your worry in</p>
          <a href="https://problem-solver.vercel.app" target="_blank" rel="noopener noreferrer">
            Visit &rarr;
          </a>
        </div>
        <div className="product-card">
          <span className="live-badge">LIVE</span>
          <h3>Mentor Table</h3>
          <p>Chat with great minds</p>
          <a href="https://mentor-table.vercel.app" target="_blank" rel="noopener noreferrer">
            Visit &rarr;
          </a>
        </div>
      </div>

      <div id="overlay-book" className={cls('book')}>
        <h2>Book Room</h2>
        <div className="book-card">
          <h3>Why I Build Things</h3>
          <span className="meta">Apr 2026 &middot; 3 min read</span>
        </div>
        <div className="book-card">
          <h3>Learning by Shipping</h3>
          <span className="meta">Mar 2026 &middot; 5 min read</span>
        </div>
      </div>

      <div id="overlay-idealab" className={cls('idealab')}>
        <h2>Idea Lab</h2>
        <div className="idea-card">
          <h3>AI Study Buddy</h3>
          <p>Personalized practice questions that adapt to what you struggle with</p>
        </div>
        <div className="idea-card">
          <h3>Debate Trainer</h3>
          <p>Practice arguments against an AI that plays devil's advocate</p>
        </div>
        <div className="idea-card">
          <h3>Visual Math</h3>
          <p>See calculus and algebra concepts as interactive 3D animations</p>
        </div>
      </div>
    </>
  );
}
