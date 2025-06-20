import React, { useEffect, useState } from 'react';

const TopArtists = () => {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopArtists = async () => {
            try {
                const res = await fetch(`/lastfm/top-artists?username=charlielovett3`);
                const data = await res.json();
                setArtists(data);
            } catch (err) {
                console.error('Failed to fetch top artists:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopArtists();
    }, []);

    if (loading) return <div>Loading top artists...</div>;

    return (
        <div>
            <h2>Top Artists</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {artists.map((artist) => (
                    <li key={artist.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <img
                            src={artist.spotifyImage || "favicon.png"}
                            alt={artist.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '1rem' }}
                        />
                        <div><span style={{ fontWeight: 'bold' }}>{artist.name}: </span>{artist.playcount} plays</div>
                    </li>
                ))}
            </ul>
        </div >
    );
};

export default TopArtists;