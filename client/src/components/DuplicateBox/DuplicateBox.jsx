const DuplicateBox = ({ children, className = '' }) => {
    return (
        <div className={`duplicate-box ${className}`}>
            { children }

            <div className={`clone ${className}`}>
                { children }
            </div>
        </div>
    )
}

export default DuplicateBox