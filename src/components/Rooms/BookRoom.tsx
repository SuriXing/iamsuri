import './BookRoom.css';

interface BlogEntry {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
}

const posts: BlogEntry[] = [
  {
    slug: 'broke-mentor-table',
    title: 'How I Broke Mentor Table',
    excerpt: 'What debugging taught me about architecture — and humility.',
    date: '2026-04-01',
    readTime: '4 min',
    tag: 'Build Log',
  },
  {
    slug: 'debate-needs-tech',
    title: 'Why Debate Needs Better Tech',
    excerpt: 'Paper flow sheets in 2026? We can do better.',
    date: '2026-03-15',
    readTime: '3 min',
    tag: 'Opinion',
  },
];

export default function BookRoom() {
  return (
    <div className="book-room">
      <div className="book-room__shelf">
        {posts.map(post => (
          <article key={post.slug} className="book-card">
            <div className="book-card__spine" />
            <div className="book-card__tag">{post.tag}</div>
            <h3 className="book-card__title">{post.title}</h3>
            <p className="book-card__excerpt">{post.excerpt}</p>
            <div className="book-card__meta">
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="book-room__hint">More posts coming soon — the shelf is still being stocked.</p>
    </div>
  );
}
