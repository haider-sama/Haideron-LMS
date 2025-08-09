import ErrorPage from "./ErrorPage";

export default function InternalError() {
  return (
    <ErrorPage
      code={500}
      heading="Something Went Wrong"
      message="We're working on fixing this issue. Please try again later, or try refreshing the page."
      homeUrl="/"
      imageUrl="/server-down.png"
    />
  );
}
