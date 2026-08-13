import './SpotifyEmbedPlayer.css';

export default function SpotifyEmbedPlayer({ spotifyUri }) {
  if (!spotifyUri) return null;

  const [, tipo, id] = spotifyUri.split(':'); // "spotify:track:ID" -> ['spotify', 'track', 'ID']

  return (
    <iframe
      className="spotify-embed-player"
      src={`https://open.spotify.com/embed/${tipo}/${id}?utm_source=generator`}
      width="100%"
      height="152"
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify player"
    />
  );
}