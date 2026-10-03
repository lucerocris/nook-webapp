/** Renders schema.org structured data. `<` is escaped so a cafe name or
 * description containing `</script>` can't close the tag early — the data is
 * user/owner-supplied text. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
