import { ROOM_BY_ID } from '../../data/rooms';
import { Bookshelf } from '../parts/Bookshelf';
import { BOOK_ROOM_CONTENT } from '../../../data/bookRoom';
import type { InteractableData } from '../../store/worldStore';

const SHELF_BOOK_COLORS: ReadonlyArray<string> = BOOK_ROOM_CONTENT.shelfBookColors;

const BLOG_INTERACTABLE: InteractableData = BOOK_ROOM_CONTENT.dialogues.blog;

export function BookRoom() {
  const { center } = ROOM_BY_ID.book;
  const ox = center.x;
  const oz = center.z;

  return (
    <group>
      <Bookshelf
        x={ox - 0.8}
        z={oz - 1.0}
        rows={4}
        booksPerRow={5}
        width={1.5}
        depth={0.38}
        rowSpacing={0.5}
        baseY={0.3}
        plankColor="#8B4513"
        bookColors={SHELF_BOOK_COLORS}
        withFrameBox
        frameBoxColor="#6b3410"
        frameBoxHeight={2.0}
        frameBoxY={1.1}
      />
      {/* Invisible interactable plane on the front face of the left bookshelf */}
      <mesh
        position={[ox - 0.8, 1.1, oz - 0.79]}
        onUpdate={(m) => {
          m.userData.interactable = BLOG_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.6, 2.0, 0.02]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Bookshelf
        x={ox + 1.0}
        z={oz - 1.0}
        rows={4}
        booksPerRow={5}
        width={1.5}
        depth={0.38}
        rowSpacing={0.5}
        baseY={0.3}
        plankColor="#8B4513"
        bookColors={SHELF_BOOK_COLORS}
        withFrameBox
        frameBoxColor="#6b3410"
        frameBoxHeight={2.0}
        frameBoxY={1.1}
      />

      {/* Reading chair */}
      <mesh position={[ox - 0.5, 0.35, oz + 1.0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshPhongMaterial color="#4a3728" flatShading />
      </mesh>
      <mesh position={[ox - 0.5, 0.6, oz + 1.38]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.5, 0.1]} />
        <meshPhongMaterial color="#5a4738" flatShading />
      </mesh>
      <mesh position={[ox - 0.88, 0.52, oz + 1.0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.7]} />
        <meshPhongMaterial color="#5a4738" flatShading />
      </mesh>
      <mesh position={[ox - 0.12, 0.52, oz + 1.0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.7]} />
        <meshPhongMaterial color="#5a4738" flatShading />
      </mesh>

      {/* Reading lamp */}
      <mesh position={[ox + 0.5, 0.72, oz + 1.0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 6]} />
        <meshPhongMaterial color="#888888" flatShading />
      </mesh>
      <mesh position={[ox + 0.5, 1.38, oz + 1.0]}>
        <cylinderGeometry args={[0.02, 0.2, 0.18, 8]} />
        <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.5} flatShading />
      </mesh>
      <pointLight position={[ox + 0.5, 1.3, oz + 1.0]} color="#ffeebb" intensity={0.8} distance={8} />

      {/* Side table */}
      <mesh position={[ox + 0.5, 0.5, oz + 1.0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.5]} />
        <meshPhongMaterial color="#8B4513" flatShading />
      </mesh>
      <mesh position={[ox + 0.5, 0.28, oz + 1.0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
        <meshPhongMaterial color="#6b3410" flatShading />
      </mesh>

      {/* Coffee cup */}
      <mesh position={[ox + 0.5, 0.58, oz + 1.0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.1, 8]} />
        <meshPhongMaterial color="#dddddd" flatShading />
      </mesh>
      <mesh position={[ox + 0.5, 0.62, oz + 1.0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
        <meshPhongMaterial color="#4a2c0a" flatShading />
      </mesh>

      {/* Green rug */}
      <mesh position={[ox, 0.13, oz + 0.5]} receiveShadow>
        <boxGeometry args={[2.5, 0.02, 1.5]} />
        <meshPhongMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.1}
          transparent
          opacity={0.2}
          flatShading
        />
      </mesh>
    </group>
  );
}
