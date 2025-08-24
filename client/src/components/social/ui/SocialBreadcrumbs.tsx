import { FiChevronRight } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

const formatLabel = (segment: string) => {
    return segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const SocialBreadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter(Boolean);

    const crumbs = pathnames.map((_, index) => {
        const href = "/" + pathnames.slice(0, index + 1).join("/");
        const label = formatLabel(pathnames[index]);
        return { label, href };
    });

    return (
        <nav className="w-full text-sm py-1 text-gray-600" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
                <li>
                    <Link to="/" className="hover:underline text-blue-600">Home</Link>
                </li>
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <li key={index} className="flex items-center gap-2">
                            <FiChevronRight className="text-gray-400" size={16} />
                            {isLast ? (
                                <span className="text-gray-800 font-medium">{crumb.label}</span>
                            ) : (
                                <Link to={crumb.href} className="hover:underline text-blue-600">
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default SocialBreadcrumbs;
