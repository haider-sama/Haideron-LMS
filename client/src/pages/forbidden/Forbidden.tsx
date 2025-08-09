import ErrorPage from "./ErrorPage";

export default function Forbidden() {
  return (
    <ErrorPage
      code={403}
      heading="Access Denied"
      message="You don’t have access to this page. Please contact the administrator."
      homeUrl="/"
      imageUrl="/road-barrier.png"
    />
  );
}
