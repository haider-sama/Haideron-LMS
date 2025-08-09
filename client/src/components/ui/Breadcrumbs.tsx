// components/ui/Breadcrumbs.tsx
import { FiChevronRight } from "react-icons/fi";
import { NavLink, navLinks } from "../../constants";

export function generateBreadcrumbs(
    path: string,
    links: NavLink[] = navLinks
): Crumb[] {
    const trail: Crumb[] = [];

    function traverse(items: NavLink[], currentPath: Crumb[] = []): boolean {
        for (const item of items) {
            const nextPath = [...currentPath, { label: item.label, href: item.href, icon: item.icon }];

            if (item.href === path) {
                trail.push(...nextPath);
                return true;
            }

            if (item.subLinks && traverse(item.subLinks, nextPath)) {
                return true;
            }
        }
        return false;
    }

    traverse(links);
    return trail;
}

interface Crumb {
    label: string;
    href?: string;
    icon?: React.ElementType;
}

interface BreadcrumbsProps {
    items: Crumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <nav className="w-full text-sm mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const Icon = item.icon;

                    return (
                        <li
                            key={index}
                            className="flex items-center gap-2 truncate"
                        >
                            {!isLast && item.href ? (
                                <a
                                    href={item.href}
                                    className="text-blue-600 hover:underline transition-colors truncate inline-flex items-center gap-2 dark:text-darkBlurple dark:hover:text-darkBlurpleHover"
                                >
                                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                    <span className="truncate">{item.label}</span>
                                </a>
                            ) : !isLast && !item.href ? (
                                <span
                                    className="text-gray-400 cursor-not-allowed truncate inline-flex items-center gap-2 dark:text-darkTextMuted"
                                    title="No link available"
                                >
                                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                    <span className="truncate">{item.label}</span>
                                </span>
                            ) : (
                                <span
                                    className="font-medium text-gray-800 truncate inline-flex items-center gap-2 dark:text-darkTextPrimary"
                                    aria-current="page"
                                >
                                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                    <span className="truncate">{item.label}</span>
                                </span>
                            )}
                            {!isLast && (
                                <FiChevronRight className="text-gray-400 shrink-0 dark:text-darkTextMuted" size={16} />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};


export default Breadcrumbs;
