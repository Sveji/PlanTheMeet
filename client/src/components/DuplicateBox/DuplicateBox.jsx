const DuplicateBox = ({ children }) => {
    return (
        <div className="duplicate-box">
            { children }

            <div className="clone">
                { children }
            </div>
        </div>
    )
}

export default DuplicateBox