const ForumSignaturePreview = ({ signature }: { signature?: string }) => {
    return (
        <div className="mt-8">
            <div className="bg-gray-100 p-4 border border-gray-300 rounded-md">
                <div className="px-1 mb-4">
                    <h3 className="text-sm font-semibold uppercase text-green-600 border-b border-gray-300 pb-1 w-full">
                        Signature Preview
                    </h3>
                </div>
                <div className="flex justify-center items-center min-h-[80px] text-gray-600 text-center">
                    {signature?.trim() ? (
                        <span>{signature}</span>
                    ) : (
                        <span className="italic text-gray-400">No signature provided.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForumSignaturePreview;
