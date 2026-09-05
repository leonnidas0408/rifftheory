import './SpotifyEmbedPlayer.css';

export default function SpotifyEmbedPlayer({ spotifyUri, height }) {
  if (!spotifyUri) return null;

  const [, tipo, id] = spotifyUri.split(':'); // "spotify:track:ID" -> ['spotify', 'track', 'ID']

  const altura = height || (tipo === 'track' ? 152 : 352);

  return (
    <iframe
      className="spotify-embed-player"
      src={`https://open.spotify.com/embed/${tipo}/${id}?utm_source=generator`}
      width="100%"
      height={altura}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify player"
    />
  );
}