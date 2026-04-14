import { ideas } from '../../data/ideas';
import './IdeaLab.css';

export default function IdeaLab() {
  return (
    <div className="idea-lab">
      {/* Whiteboard */}
      <div className="idea-lab__whiteboard">
        <div className="idea-lab__whiteboard-header">
          <span>📋</span> What's Brewing
        </div>
        <p className="idea-lab__whiteboard-sub">
          Ideas I'm obsessed with. If you're thinking about these too — find me.
        </p>
      </div>

      {/* Idea cards */}
      <div className="idea-lab__grid">
        {ideas.map(idea => (
          <div key={idea.slug} className="idea-card">
            {idea.icon && <span className="idea-card__icon">{idea.icon}</span>}
            <h3 className="idea-card__title">{idea.title}</h3>
            <p className="idea-card__why">{idea.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
