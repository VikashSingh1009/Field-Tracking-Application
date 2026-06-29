const Modal = ({ onClose, children }) => {
    return (
        //  Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>

            {/*  Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/*  Modal Box — fixed width, max height, scrollable */}
            <div className="relative bg-white rounded-2xl shadow-xl 
                            w-full max-w-lg       
                            max-h-[90vh]          
                            overflow-y-auto       
                            z-10">

                {/*  Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 
                               text-slate-400 hover:text-slate-600 
                               hover:bg-slate-100 rounded-lg 
                               transition-colors z-20"
                >
                    <svg className="w-4 h-4" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/*  Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;