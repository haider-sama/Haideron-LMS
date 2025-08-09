// pages/404.tsx or similar
import ErrorPage from "./ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      heading="Page Not Found"
      message="Oops! The page you're looking for doesn't exist."
      homeUrl="/"
      imageUrl="/astro.png"
    />
  );
}
