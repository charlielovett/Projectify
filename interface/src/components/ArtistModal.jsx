import { useEffect, useRef } from "react";

const ArtistModal = ({ name, playcount, image, closeModal }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeModal]);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
            <div className="flex flex-col gap-2 justify-center items-center bg-white p-6 rounded-lg max-w-[400px] shadow-[0_0_20px_rgba(0,0,0,0.25)]" ref={modalRef}>
                <h2>{name}</h2>
                <p>{playcount} plays</p>
                <img
                    className="w-[100px] h-[100px] rounded-full"
                    src={image || "favicon.png"}
                    alt={name}
                />
            </div>
        </div>
    );
}

export default ArtistModal;
