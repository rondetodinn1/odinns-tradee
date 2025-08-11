import NewsCalendarClient from "./news-calendar-client"

// Server Component (default). Renders the client wrapper.
// Kept exactly minimal: no changes to news logic or visuals beyond moving
// the dynamic import into a dedicated client file.
export function NewsComingSoon() {
  return (
    <div className="w-full">
      <NewsCalendarClient />
    </div>
  )
}

export default NewsComingSoon
