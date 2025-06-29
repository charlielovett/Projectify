import { useEffect, useState } from 'react';

const NowPlaying = () => {
  const [track, setTrack] = useState(null);
  const [progressMs, setProgressMs] = useState(0);

  useEffect(() => {
    let progressInterval;

    const fetchTrack = async () => {
      try {
        const response = await fetch('/currently-playing');
        if (response.status === 204 || !response.ok) {
          setTrack(null);
          setProgressMs(0);
          return;
        }

        const data = await response.json();
        if (!data.name || !data.artist || !data.albumCover) {
          setTrack(null);
          setProgressMs(0);
          return;
        }

        setTrack(data);
        setProgressMs(data.progressMs);

        if (progressInterval) clearInterval(progressInterval);
        if (data.isPlaying) {
          progressInterval = setInterval(() => {
            setProgressMs((prev) => prev + 1000);
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching track:', err);
        setTrack(null);
        setProgressMs(0);
      }
    };

    fetchTrack();
    const pollInterval = setInterval(fetchTrack, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (!track) return <p>No song currently playing</p>;

  const percentage = (progressMs / track.durationMs) * 100;

  return (
    <div className="flex flex-col items-start justify-center gap-2">
      <div className="relative w-[300px] h-[300px] self-center">
        <img
          className="w-[300px] h-[300px] block"
          src={track.albumCover}
          alt="Album cover"
        />

        {!track.isPlaying && (
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center text-white text-5xl pointer-events-none'>
            ▶
          </div>
        )}
      </div>

      <h2 className='m-0 text-lg font-semibold'>{track.name}</h2>
      <p className="m-0 text-base text-gray-300">{track.artist}</p>

      <input
        className="self-center"
        type="range"
        min={0}
        max={100}
        value={percentage}
        readOnly
        style={{
          '--range-progress': `${percentage}%`,
          width: 300,
        }}
      />
    </div>
  );
}

export default NowPlaying;