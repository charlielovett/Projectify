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
        <div className="modal-background">
            <div className="modal-content" ref={modalRef}>
                <h2>{name}</h2>
                <p>{playcount} plays</p>
                <img
                    src={image || "favicon.png"}
                    alt={name}
                    style={{ width: 100, height: 100, borderRadius: "50%" }}
                />
            </div>
        </div>
    );
}

export default ArtistModal;
