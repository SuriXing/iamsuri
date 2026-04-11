import './MyRoom.css';

export default function MyRoom() {
  return (
    <div className="my-room">
      <div className="my-room__bio">
        <div className="my-room__avatar">👩‍💻</div>
        <h2>Hey, I'm Suri.</h2>
        <p>
          I'm in 8th grade. I build things for curious minds — apps that help people think,
          ask better questions, and learn from the best.
        </p>
        <div className="my-room__tags">
          <span className="my-room__tag">🧮 Math</span>
          <span className="my-room__tag">🎨 Design</span>
          <span className="my-room__tag">🗣️ Debate</span>
          <span className="my-room__tag">💻 Building</span>
        </div>
      </div>

      <div className="my-room__shelves">
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🖥️ My Desk</div>
          <p>Where the building happens. React, TypeScript, Vite, Supabase — whatever gets the job done.</p>
        </div>
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🎨 On The Wall</div>
          <p>My artwork was exhibited at <em>Embracing Our Differences</em> — a billboard-sized outdoor art exhibit in Sarasota, FL.</p>
        </div>
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🏆 Awards Shelf</div>
          <p>Math competitions, debate tournaments, and art exhibits. The fun kind of collecting.</p>
        </div>
      </div>
    </div>
  );
}
