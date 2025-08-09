import ErrorPage from "./ErrorPage";

export default function Unauthorized() {
  return (
    <ErrorPage
      code={401}
      heading="Unauthorized"
      message="You don’t have permission to view this page. Please login and try again."
      homeUrl="/login"
      imageUrl="/no-entry.png"
    />
  );
}
