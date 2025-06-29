import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ArtistModal from './ArtistModal';

const TopArtists = () => {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeArtist, setActiveArtist] = useState(null);
    const svgRef = useRef(null);
    const hasInitialized = useRef(false);

    const width = 600;
    const height = 600;

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

    useEffect(() => {
        if (loading || artists.length === 0 || hasInitialized.current) return;
        hasInitialized.current = true;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove();

        const defs = svg.append("defs");

        // Create unique circular clipPaths for each artist
        artists.forEach((d, i) => {
            defs.append("clipPath")
                .attr("id", `clip-${i}`)
                .append("circle")
                .attr("r", 1) // placeholder, updated dynamically below
                .attr("cx", 0)
                .attr("cy", 0);
        });

        // const tooltip = d3.select(svgRef.current.parentElement)
        //     .append("div")
        //     .attr("class", "tooltip")
        //     .style("position", "absolute")
        //     .style("opacity", 0)
        //     .style("background", "white")
        //     .style("border", "1px solid black")
        //     .style("border-radius", "4px")
        //     .style("padding", "6px");

        const size = d3.scaleSqrt()
            .domain([d3.min(artists, d => +d.playcount), d3.max(artists, d => +d.playcount)])
            .range([15, 100]);

        const node = svg.append("g")
            .selectAll("g")
            .data(artists)
            .join("g")
            .attr("class", "artist-node");

        node.append("image")
            .attr("xlink:href", d => d.spotifyImage || "favicon.png")
            .attr("clip-path", (d, i) => `url(#clip-${i})`)
            .attr("width", d => size(+d.playcount) * 2)
            .attr("height", d => size(+d.playcount) * 2)
            .attr("x", d => -size(+d.playcount))
            .attr("y", d => -size(+d.playcount))
            // .on("mouseover", (event, d) => tooltip.style("opacity", 1))
            .on("click", (event, d) => {
                setActiveArtist(d);
                event.stopPropagation();
            });

        // Update each clipPath radius to match image
        node.each(function (d, i) {
            d.r = size(+d.playcount);
            svg.select(`#clip-${i}`).select("circle").attr("r", d.r);
        });

        const simulation = d3.forceSimulation(artists)
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(0.02))
            .force("y", d3.forceY(height / 2).strength(0.02))
            .force("charge", d3.forceManyBody().strength(0.03)) // gentle repulsion
            .force("collision", d3.forceCollide().radius(d => size(+d.playcount) + 2))
            .on("tick", () => {
                node.attr("transform", d => {
                    d.x = Math.max(d.r, Math.min(width - d.r, d.x));
                    d.y = Math.max(d.r, Math.min(height - d.r, d.y));
                    return `translate(${d.x}, ${d.y})`;
                });
            });

        node.call(
            d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                })
        );
    }, [artists, loading]);

    if (loading) return <div>Loading top artists...</div>;

    return (
        <div style={{ position: "relative" }}>
            <svg ref={svgRef}></svg>
            {activeArtist && (
                <ArtistModal
                    name={activeArtist.name}
                    playcount={activeArtist.playcount}
                    image={activeArtist.spotifyImage}
                    closeModal={() => setActiveArtist(null)}
                ></ArtistModal>
            )}
        </div>
    );
};

export default TopArtists;
