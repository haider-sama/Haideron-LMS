import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import { FiBold, FiItalic, FiUnderline, FiSend } from "react-icons/fi";
import { MdStrikethroughS, MdCode } from "react-icons/md";
import { useEffect, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";

interface CommentBoxProps {
    onSubmit: (html: string) => void;
}

export const CommentBox: React.FC<CommentBoxProps> = ({ onSubmit }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                underline: false, // disable built-in
                strike: false,    // disable built-in
            }),
            Underline,
            Strike,
            Placeholder.configure({
                emptyEditorClass: "is-editor-empty",
            }),
        ],
        content: "",
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2 rounded-md bg-white",
            },
        },
    });

    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (!editor) return undefined;

        const updateStatus = () => setIsEmpty(editor.isEmpty);

        editor.on("update", updateStatus);
        updateStatus();

        return () => {
            editor.off("update", updateStatus);
        };
    }, [editor]);

    const handleSend = () => {
        const text = editor?.getText();
        if (text?.trim()) {
            onSubmit(text);
            editor?.commands.clearContent();
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl shadow-md bg-white px-4 py-3 transition-all focus-within:ring-2 ring-primary">
            {/* Editor */}
            <EditorContent
                editor={editor}
                className="border rounded-md bg-gray-50"
            />

            {/* Toolbar & Submit */}
            <div className="flex items-center justify-between mt-3">
                {/* Formatting Buttons */}
                <div className="flex gap-2">
                    <ToolbarButton
                        active={editor?.isActive("bold")}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <FiBold size={18} />
                    </ToolbarButton>

                    <ToolbarButton
                        active={editor?.isActive("italic")}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <FiItalic size={18} />
                    </ToolbarButton>

                    <ToolbarButton
                        active={editor?.isActive("underline")}
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        title="Underline"
                    >
                        <FiUnderline size={18} />
                    </ToolbarButton>

                    <ToolbarButton
                        active={editor?.isActive("strike")}
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        title="Strikethrough"
                    >
                        <MdStrikethroughS size={18} />
                    </ToolbarButton>

                    <ToolbarButton
                        active={editor?.isActive("code")}
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        title="Code"
                    >
                        <MdCode size={18} />
                    </ToolbarButton>
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={isEmpty}
                    className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 transition ${isEmpty
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-white bg-primary hover:bg-white hover:text-primary"
                        }`}
                >
                    <FiSend size={16} />
                    <span>Post</span>
                </button>
            </div>
        </div>
    );
};

// Shared toolbar button component
const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
}: {
    onClick?: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
}) => (
    <div className="relative group">
        <button
            type="button"
            onClick={onClick}
            className={`p-1 rounded-md transition hover:bg-gray-100 ${active ? "text-blue-600" : "text-gray-600"
                }`}
        >
            {children}
        </button>

        {/* Tooltip */}
        {title && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                {title}
            </div>
        )}
    </div>
);